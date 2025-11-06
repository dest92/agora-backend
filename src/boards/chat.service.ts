import { Injectable } from '@nestjs/common';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';
import { sql } from '../shared/database/sql';
import type { ChatMessage, ChatMessageRow } from './types/chat.types';

/**
 * Service for managing board chat messages
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly pg: PgService,
    private readonly realtime: RealtimeService,
  ) {}

  async sendMessage(
    boardId: string,
    userId: string,
    content: string,
  ): Promise<ChatMessage> {
    const query = sql`
      INSERT INTO boards.chat_messages (board_id, user_id, content)
      VALUES (${boardId}, ${userId}, ${content})
      RETURNING id, board_id, user_id, content, created_at, updated_at
    `;
    const result = await this.pg.query<ChatMessageRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to send message');
    }
    const message = this.mapRowToMessage(row);
    await this.realtime.publish(`room:board:${boardId}`, 'chat:message:sent', {
      id: message.id,
      boardId: message.boardId,
      userId: message.userId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
    return message;
  }

  async listMessages(
    boardId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    const query = sql`
      SELECT id, board_id, user_id, content, created_at, updated_at
      FROM boards.chat_messages
      WHERE board_id = ${boardId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    const result = await this.pg.query<ChatMessageRow>(query);
    return result.rows.map((row) => this.mapRowToMessage(row)).reverse();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const query = sql`
      DELETE FROM boards.chat_messages
      WHERE id = ${messageId} AND user_id = ${userId}
      RETURNING board_id
    `;
    const result = await this.pg.query<{ board_id: string }>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Message not found or unauthorized');
    }
    await this.realtime.publish(`room:board:${row.board_id}`, 'chat:message:deleted', {
      messageId,
      userId,
    });
  }

  private mapRowToMessage(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      boardId: row.board_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
