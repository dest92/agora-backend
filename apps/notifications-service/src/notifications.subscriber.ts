import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events';

@Injectable()
export class NotificationsSubscriber implements OnModuleInit {
  constructor(@Inject('EventBus') private readonly eventBus: EventBus) {}

  async onModuleInit() {
    // Subscribe to all domain events for logging
    await this.eventBus.subscribe('card', this.handleEvent.bind(this));
    await this.eventBus.subscribe('comment', this.handleEvent.bind(this));
    await this.eventBus.subscribe('vote', this.handleEvent.bind(this));
    await this.eventBus.subscribe('tag', this.handleEvent.bind(this));
    await this.eventBus.subscribe('assignee', this.handleEvent.bind(this));
  }

  private handleEvent(event: DomainEvent): void {
    console.log(`[NOTIFICATION] Event received:`, {
      name: event.name,
      boardId: event.meta?.boardId,
      occurredAt: event.meta?.occurredAt,
      payload: event.payload,
    });

    // TODO: Implement actual notification logic
    // - Send emails
    // - Push notifications
    // - In-app notifications
    // - Slack/Discord webhooks
  }
}
