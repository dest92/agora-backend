import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './socket/redis-io.adapter';

/**
 * API Gateway Pattern: HTTP + WebSocket único punto de entrada
 * Socket.IO: Redis adapter para escalabilidad horizontal
 * Microservicios: Gateway → Services TCP
 */

async function bootstrap() {
  // Runtime: Require REDIS_URL for Socket.IO adapter (except in tests)
  if (process.env.NODE_ENV !== 'test' && !process.env.REDIS_URL) {
    throw new Error(
      'REDIS_URL is required for Socket.IO Redis adapter. Set REDIS_URL environment variable.',
    );
  }

  const app = await NestFactory.create(AppModule);

  // Observer/Pub-Sub: Socket.IO with Redis adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.GATEWAY_PORT || 3000;
  await app.listen(port);
  console.log(`API Gateway (HTTP + Socket.IO) listening on port ${port}`);

  // Graceful Shutdown: Handle process termination signals
  process.on('SIGTERM', () => {
    void (async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    })();
  });
}
bootstrap();
