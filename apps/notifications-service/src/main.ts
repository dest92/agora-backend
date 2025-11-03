import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);

  const port = process.env.NOTIFICATIONS_PORT || 3014;
  await app.listen(port);
  console.log(`Notifications Service listening on port ${port}`);
}
bootstrap();
