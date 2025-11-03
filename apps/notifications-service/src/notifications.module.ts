import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '@app/lib-events';
import { NotificationsSubscriber } from './notifications.subscriber';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EventsModule],
  controllers: [NotificationsController],
  providers: [NotificationsSubscriber],
})
export class NotificationsModule {}
