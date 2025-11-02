import { Injectable } from '@nestjs/common';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';
import { sql } from '../shared/database/sql';
import type { CreateCardDto } from './dto/create-card.dto';
import type { UpdateCardDto } from './dto/update-card.dto';
import type { Card, CardRow } from './types/card.types';

interface CreateCardInput extends CreateCardDto {
  boardId: string;
  authorId: string;
}

@Injectable()
export class BoardsService {
  constructor(
    private readonly pg: PgService,
    private readonly realtime: RealtimeService,
  ) {}

  async createCard(input: CreateCardInput): Promise<Card> {
    const { boardId, authorId, content, laneId, priority, position } = input;
    const query = sql`
      INSERT INTO boards.cards (board_id, author_id, content, lane_id, priority, position)
      VALUES (${boardId}, ${authorId}, ${content}, ${laneId || null}, COALESCE(${priority}, 'normal'), COALESCE(${position}, 1000))
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create card');
    }
    const card = this.mapRowToCard(row);
    await this.realtime.publish(`room:board:${boardId}`, 'card:created', {
      cardId: card.id,
      boardId: card.boardId,
      content: card.content,
      authorId: card.authorId,
      laneId: card.laneId,
      priority: card.priority,
      position: card.position,
      createdAt: card.createdAt.toISOString(),
    });
    return card;
  }

  async listCards(boardId: string, laneId?: string): Promise<Card[]> {
    const query = sql`
      SELECT id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at
      FROM boards.cards
      WHERE board_id = ${boardId}
        AND (${laneId || null}::uuid IS NULL OR lane_id = ${laneId || null}::uuid)
        AND archived_at IS NULL
      ORDER BY position ASC, created_at ASC
    `;
    const result = await this.pg.query<CardRow>(query);
    return result.rows.map((row) => this.mapRowToCard(row));
  }

  async updateCard(
    cardId: string,
    boardId: string,
    dto: UpdateCardDto,
  ): Promise<Card> {
    const previousQuery = sql`
      SELECT lane_id FROM boards.cards WHERE id = ${cardId} AND board_id = ${boardId}
    `;
    const previousResult = await this.pg.query<{ lane_id: string | null }>(
      previousQuery,
    );
    const previousLaneId = previousResult.rows[0]?.lane_id;
    const query = sql`
      UPDATE boards.cards
      SET
        content = COALESCE(${dto.content || null}, content),
        lane_id = COALESCE(${dto.laneId || null}::uuid, lane_id),
        priority = COALESCE(${dto.priority || null}, priority),
        position = COALESCE(${dto.position ?? null}, position),
        updated_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId}
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Card not found');
    }
    const card = this.mapRowToCard(row);
    const laneChanged = dto.laneId && dto.laneId !== previousLaneId;
    const event = laneChanged ? 'card:moved' : 'card:updated';
    await this.realtime.publish(`room:board:${boardId}`, event, {
      cardId: card.id,
      boardId: card.boardId,
      laneId: card.laneId,
      priority: card.priority,
      position: card.position,
      content: card.content,
      archived: false,
      updatedAt: card.updatedAt.toISOString(),
    });
    return card;
  }

  async archiveCard(cardId: string, boardId: string): Promise<Card> {
    const query = sql`
      UPDATE boards.cards
      SET archived_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId} AND archived_at IS NULL
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Card not found or already archived');
    }
    const card = this.mapRowToCard(row);
    await this.realtime.publish(`room:board:${boardId}`, 'card:archived', {
      cardId: card.id,
      boardId: card.boardId,
      laneId: card.laneId,
      priority: card.priority,
      position: card.position,
      archived: true,
      updatedAt: card.archivedAt?.toISOString() || new Date().toISOString(),
    });
    return card;
  }

  async unarchiveCard(cardId: string, boardId: string): Promise<Card> {
    const query = sql`
      UPDATE boards.cards
      SET archived_at = NULL, updated_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId} AND archived_at IS NOT NULL
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Card not found or not archived');
    }
    const card = this.mapRowToCard(row);
    await this.realtime.publish(`room:board:${boardId}`, 'card:unarchived', {
      cardId: card.id,
      boardId: card.boardId,
      laneId: card.laneId,
      priority: card.priority,
      position: card.position,
      archived: false,
      updatedAt: card.updatedAt.toISOString(),
    });
    return card;
  }

  async refreshProjections(): Promise<{ refreshed: boolean }> {
    try {
      await this.pg.query(
        sql`SELECT projections.refresh_mv_board_lane_counts()`,
      );
    } catch {
      // Ignore if view doesn't exist
    }
    try {
      await this.pg.query(
        sql`SELECT projections.refresh_mv_card_counters()`,
      );
    } catch {
      // Ignore if view doesn't exist
    }
    return { refreshed: true };
  }

  private mapRowToCard(row: CardRow): Card {
    return {
      id: row.id,
      boardId: row.board_id,
      authorId: row.author_id,
      content: row.content,
      laneId: row.lane_id,
      priority: row.priority,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }
}
