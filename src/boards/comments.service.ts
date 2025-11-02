import { Injectable } from '@nestjs/common';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';
import { sql } from '../shared/database/sql';

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface CommentRow {
  id: string;
  card_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}

/**
 * Service for managing card comments
 */
@Injectable()
export class CommentsService {
  constructor(
    private readonly pg: PgService,
    private readonly realtime: RealtimeService,
  ) {}

  async addComment(
    cardId: string,
    authorId: string,
    content: string,
    boardId: string,
  ): Promise<Comment> {
    const query = sql`
      INSERT INTO boards.comments (card_id, author_id, content)
      VALUES (${cardId}, ${authorId}, ${content})
      RETURNING id, card_id, author_id, content, created_at
    `;
    const result = await this.pg.query<CommentRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create comment');
    }
    const comment = this.mapRowToComment(row);
    await this.realtime.publish(`room:board:${boardId}`, 'comment:added', {
      commentId: comment.id,
      cardId: comment.cardId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    });
    return comment;
  }

  async listComments(cardId: string): Promise<Comment[]> {
    const query = sql`
      SELECT id, card_id, author_id, content, created_at
      FROM boards.comments
      WHERE card_id = ${cardId}
      ORDER BY created_at ASC
    `;
    const result = await this.pg.query<CommentRow>(query);
    return result.rows.map((row) => this.mapRowToComment(row));
  }

  private mapRowToComment(row: CommentRow): Comment {
    return {
      id: row.id,
      cardId: row.card_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
    };
  }
}
