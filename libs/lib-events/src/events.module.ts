import { Global, Module } from '@nestjs/common';
import { RedisEventBus } from './redis-event-bus';
import { MockEventBus } from './mock-event-bus';

/**
 * EDA Pattern: Redis-first EventBus module
 * Singleton: Global Redis EventBus provider
 * Runtime: Only Redis (no MockEventBus fallback)
 * Tests: MockEventBus allowed only when NODE_ENV=test
 */

@Global()
@Module({
  providers: [
    {
      provide: 'EventBus',
      useFactory: () => {
        // Tests: Allow MockEventBus only in test environment
        if (process.env.NODE_ENV === 'test') {
          return new MockEventBus();
        }

        // Runtime: Require REDIS_URL, fail startup if missing
        if (!process.env.REDIS_URL) {
          throw new Error(
            'REDIS_URL is required for EventBus. Set REDIS_URL environment variable (e.g., rediss://:<password>@<host>:<port>)',
          );
        }

        return new RedisEventBus();
      },
    },
  ],
  exports: ['EventBus'],
})
export class EventsModule {}
