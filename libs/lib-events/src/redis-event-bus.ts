import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import type { EventBus, DomainEvent } from './event-bus.port';

@Injectable()
export class RedisEventBus implements EventBus, OnModuleInit {
  private publisher!: RedisClientType;
  private subscriber!: RedisClientType;
  private handlers = new Map<
    string,
    Set<(event: DomainEvent) => Promise<void> | void>
  >();

  async onModuleInit(): Promise<void> {
    const redisConfig = {
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    };
    
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
  }

  async subscribe(
    pattern: string,
    handler: (event: DomainEvent) => Promise<void> | void,
  ): Promise<void> {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, new Set());
    }
    this.handlers.get(pattern).add(handler);
  }
}
