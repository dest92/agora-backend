import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events';
import { createClient } from '@supabase/supabase-js';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSubscriber implements OnModuleInit {
  private supabase: any; // Use any to avoid schema typing issues

  constructor(
    @Inject('EventBus') private readonly eventBus: EventBus,
    private readonly notificationsService: NotificationsService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'boards',
        },
      },
    );
  }

  async onModuleInit() {
    // Subscribe to domain events
    await this.eventBus.subscribe('card', this.handleEvent.bind(this));
    await this.eventBus.subscribe('comment', this.handleEvent.bind(this));
    await this.eventBus.subscribe('vote', this.handleEvent.bind(this));
    await this.eventBus.subscribe('tag', this.handleEvent.bind(this));
    await this.eventBus.subscribe('assignee', this.handleEvent.bind(this));
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    console.log(`[NOTIFICATION] Event received:`, {
      name: event.name,
      boardId: event.meta?.boardId,
      occurredAt: event.meta?.occurredAt,
      payload: event.payload,
    });

    try {
      // Handle comment created - notify card author
      if (event.name === 'comment:created') {
        await this.handleCommentCreated(event);
      }

      // TODO: Handle other events
      // - card:assigned -> notify assignee
      // - vote:added -> notify card author
      // - workspace:member_invited -> notify invited user
    } catch (error) {
      console.error('[NOTIFICATION] Error handling event:', error);
    }
  }

  private async handleCommentCreated(event: DomainEvent): Promise<void> {
    const { cardId, authorId, content } = event.payload as any;

    console.log('💬 Comment created, finding card author...');

    // Get card info to find the card author
    const { data: card, error } = await this.supabase
      .from('cards')
      .select('author_id, content')
      .eq('id', cardId)
      .single();

    if (error || !card) {
      console.error('❌ Failed to find card:', error);
      return;
    }

    const cardAuthorId = card.author_id;

    // Don't notify if author comments on own card
    if (cardAuthorId === authorId) {
      console.log('⏭️ Author commented on own card, skipping notification');
      return;
    }

    // Get comment author info
    const { data: authData } = await this.supabase.auth.admin.listUsers();
    const commentAuthor = authData?.users?.find((u: any) => u.id === authorId);
    const commentAuthorName =
      commentAuthor?.user_metadata?.name ||
      commentAuthor?.email?.split('@')[0] ||
      'Someone';

    // Create notification
    const notification = await this.notificationsService.createNotification({
      userId: cardAuthorId,
      type: 'comment',
      title: 'New comment on your card',
      body: `${commentAuthorName} commented: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
    });

    // Emit real-time event for the notification
    // Put the recipientId inside the payload to avoid constraining "meta" shape
    await this.eventBus.publish({
      name: 'notification:created',
      payload: { ...notification, recipientId: cardAuthorId },
      meta: {
        occurredAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Notification sent to card author: ${cardAuthorId}`);
  }
}
