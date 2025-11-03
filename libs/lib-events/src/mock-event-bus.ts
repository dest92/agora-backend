import { Injectable } from '@nestjs/common';
import type { EventBus, DomainEvent } from './event-bus.port';

@Injectable()
export class MockEventBus implements EventBus {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`[MOCK EVENT BUS] Published event: ${event.name}`, {
      payload: event.payload,
      meta: event.meta,
    });
  }

  async subscribe(
    pattern: string,
    handler: (event: DomainEvent) => Promise<void> | void,
  ): Promise<void> {
    console.log(`[MOCK EVENT BUS] Subscribed to pattern: ${pattern}`);
    // Mock implementation - no actual subscription
  }

  async ping(): Promise<boolean> {
    // Mock implementation always returns true
    return true;
  }
}
