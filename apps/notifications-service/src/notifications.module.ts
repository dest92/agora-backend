import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '@app/lib-events';
import { NotificationsSubscriber } from './notifications.subscriber';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EventsModule],
  providers: [NotificationsSubscriber],
})
export class NotificationsModule {}
