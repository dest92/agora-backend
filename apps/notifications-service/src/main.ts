import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';

/**
 * Microservices Pattern: TCP transport para comunicación interna
 * Cliente-Servidor: Gateway HTTP → Notifications TCP
 * Singleton: @Global modules compartidos
 */

async function bootstrap(): Promise<void> {
  const port = parseInt(process.env.NOTIFICATIONS_PORT || '3014', 10);
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  console.log(`Notifications Service (TCP) listening on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start notifications-service:', error);
  process.exit(1);
});
