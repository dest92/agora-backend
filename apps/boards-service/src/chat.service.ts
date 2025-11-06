import { Injectable, Inject } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events/event-bus.port';
import { ChatDao } from './chat.dao';
import type { ChatMessageRow } from './chat.dao';

interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatDao: ChatDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async sendMessage(
    boardId: string,
    userId: string,
    content: string,
  ): Promise<ChatMessage> {
    const row = await this.chatDao.createMessage(boardId, userId, content);
    const message = this.mapRowToMessage(row);

    const event: DomainEvent = {
      name: 'chat:message:sent',
      payload: {
        id: message.id,
        boardId: message.boardId,
        userId: message.userId,
        userName: message.userName,
        content: message.content,
        createdAt: message.createdAt,
      },
      meta: {
        boardId: message.boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return message;
  }

  async listMessages(boardId: string, limit: number): Promise<ChatMessage[]> {
    const rows = await this.chatDao.listMessages(boardId, limit);
    return rows.map((row) => this.mapRowToMessage(row));
  }

  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<{ deleted: boolean }> {
    const boardId = await this.chatDao.deleteMessage(messageId, userId);
    if (!boardId) {
      throw new Error('Message not found or unauthorized');
    }

    const event: DomainEvent = {
      name: 'chat:message:deleted',
      payload: {
        messageId,
        userId,
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return { deleted: true };
  }

  private mapRowToMessage(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      boardId: row.board_id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      content: row.content,
      createdAt:
        typeof row.created_at === 'string'
          ? row.created_at
          : row.created_at.toISOString(),
      updatedAt:
        typeof row.updated_at === 'string'
          ? row.updated_at
          : row.updated_at.toISOString(),
    };
  }
}
