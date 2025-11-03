import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import type { EventBus, DomainEvent } from './event-bus.port';

/**
 * EDA Pattern: Redis Pub/Sub EventBus adapter
 * Singleton: Cliente Redis compartido por proceso
 * Observer: Suscripción a patrones de eventos
 */

@Injectable()
export class RedisEventBus implements EventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventBus.name);
  private publisher!: RedisClientType;
  private subscriber!: RedisClientType;
  private handlers = new Map<
    string,
    Set<(event: DomainEvent) => Promise<void> | void>
  >();

  async onModuleInit(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Configurar timeouts y retries
    const redisConfig = {
      url: redisUrl,
      socket: {
        connectTimeout: 10000, // 10s
        commandTimeout: 8000,  // 8s
        reconnectStrategy: (retries: number) => {
          // Exponential backoff with jitter, max 30s
          const delay = Math.min(Math.pow(2, retries) * 1000 + Math.random() * 1000, 30000);
          this.logger.warn(`Redis reconnect attempt ${retries + 1}, delay: ${delay}ms`);
          return delay;
        },
      },
    };

    this.logger.log(`Connecting to Redis: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);
    
    this.publisher = createClient(redisConfig);
    this.subscriber = this.publisher.duplicate();

    await this.publisher.connect();
    await this.subscriber.connect();

    await this.subscriber.pSubscribe(
      'event:*',
      async (message: string, channel: string) => {
        const event = JSON.parse(message) as DomainEvent;
        const pattern = channel.replace('event:', '').split(':')[0];

        const handlersSet = this.handlers.get(pattern);
        if (handlersSet) {
          for (const handler of handlersSet) {
            await handler(event);
          }
        }
      },
    );
  }

  async publish(event: DomainEvent): Promise<void> {
    const startTime = Date.now();
    const enrichedEvent: DomainEvent = {
      ...event,
      meta: {
        ...event.meta,
        occurredAt: event.meta?.occurredAt || new Date().toISOString(),
      },
    };

    await this.publisher.publish(
      `event:${event.name}`,
      JSON.stringify(enrichedEvent),
    );

    const publishLatencyMs = Date.now() - startTime;
    
    // Log compacto por DomainEvent
    const room = event.meta?.boardId || event.meta?.workspaceId || 'unknown';
    this.logger.log(
      `Published: ${event.name} | room: ${room} | latency: ${publishLatencyMs}ms`,
    );
  }

  async subscribe(
    pattern: string,
    handler: (event: DomainEvent) => Promise<void> | void,
  ): Promise<void> {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, new Set());
    }
    this.handlers.get(pattern)!.add(handler);
  }

  /**
   * Health Check: Ping Redis connection
   * Non-destructive verification for health endpoint
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.publisher?.isOpen) {
        return false;
      }
      
      // Non-destructive ping using Redis PING command
      const pong = await this.publisher.ping();
      return pong === 'PONG';
    } catch (error) {
      this.logger.warn('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Graceful Shutdown: Cerrar conexiones Redis
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connections...');
    
    try {
      if (this.subscriber?.isOpen) {
        await this.subscriber.disconnect();
      }
      if (this.publisher?.isOpen) {
        await this.publisher.disconnect();
      }
      this.logger.log('Redis connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
    }
  }
}
