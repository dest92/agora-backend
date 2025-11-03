import { Module, Global } from '@nestjs/common';
import { RedisEventBus } from './redis-event-bus';

@Global()
@Module({
  providers: [
    {
      provide: 'EventBus',
      useClass: RedisEventBus,
    },
  ],
  exports: ['EventBus'],
})
export class EventsModule {}
