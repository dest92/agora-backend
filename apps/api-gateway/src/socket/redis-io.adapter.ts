import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';

/**
 * Observer/Pub-Sub Pattern: Socket.IO Redis adapter
 * Singleton: Redis clients para pub/sub
 * EDA: Escalabilidad horizontal de WebSocket
 */

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      if (process.env.NODE_ENV === 'test') {
        this.logger.warn('REDIS_URL not set, using default IoAdapter for tests');
        return;
      }
      throw new Error('REDIS_URL is required for Redis adapter');
    }

    this.logger.log(`Connecting Socket.IO to Redis: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);

    // Crear dos clientes Redis para pub/sub
    const pubClient = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
      },
    });
    
    const subClient = pubClient.duplicate();

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter connected successfully');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Socket.IO server configured with Redis adapter');
    }
    
    return server;
  }
}
