import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SessionsModule } from './sessions.module';

/**
 * Microservices Pattern: TCP transport para comunicación interna
 * Cliente-Servidor: Gateway HTTP → Sessions TCP
 * Singleton: @Global modules compartidos
 */

async function bootstrap(): Promise<void> {
  const port = parseInt(process.env.SESSIONS_PORT || '3013', 10);
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SessionsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  console.log(`sessions-service listening on :${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start sessions-service:', error);
  process.exit(1);
});
