import { Injectable } from '@nestjs/common';
import { PgService } from '@app/lib-db/pg.service';
import { sql } from '@app/lib-db/sql';

interface CardRow {
  id: string;
  board_id: string;
  author_id: string;
  content: string;
  lane_id: string | null;
  priority: string;
  position: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

@Injectable()
export class BoardsDao {
  constructor(private readonly pg: PgService) {}

  async createCard(input: {
    boardId: string;
    authorId: string;
    content: string;
    priority: string;
    position: number;
    laneId?: string;
  }): Promise<CardRow> {
    const query = sql`
      INSERT INTO boards.cards (board_id, author_id, content, priority, position, lane_id)
      VALUES (${input.boardId}, ${input.authorId}, ${input.content}, ${input.priority}, ${input.position}, ${input.laneId || null})
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    return result.rows[0];
  }

  async listCards(boardId: string, laneId?: string): Promise<CardRow[]> {
    const query = sql`
      SELECT id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
      FROM boards.cards
      WHERE board_id = ${boardId}
        AND (${laneId || null}::uuid IS NULL OR lane_id = ${laneId || null}::uuid)
        AND archived_at IS NULL
      ORDER BY position ASC, created_at ASC
    `;
    const result = await this.pg.query<CardRow>(query);
    return result.rows;
  }

  async updateCard(
    cardId: string,
    boardId: string,
    updates: {
      content?: string;
      laneId?: string;
      priority?: string;
      position?: number;
    },
  ): Promise<{ previousLaneId: string | null; card: CardRow }> {
    const previousQuery = sql`
      SELECT lane_id FROM boards.cards WHERE id = ${cardId} AND board_id = ${boardId}
    `;
    const previousResult = await this.pg.query<{ lane_id: string | null }>(
      previousQuery,
    );
    const previousLaneId = previousResult.rows[0]?.lane_id || null;

    const updateQuery = sql`
      UPDATE boards.cards
      SET
        content = COALESCE(${updates.content || null}, content),
        lane_id = COALESCE(${updates.laneId || null}::uuid, lane_id),
        priority = COALESCE(${updates.priority || null}, priority),
        position = COALESCE(${updates.position ?? null}, position),
        updated_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId}
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(updateQuery);
    return { previousLaneId, card: result.rows[0] };
  }

  async archiveCard(cardId: string, boardId: string): Promise<CardRow> {
    const query = sql`
      UPDATE boards.cards
      SET archived_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId} AND archived_at IS NULL
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    return result.rows[0];
  }

  async unarchiveCard(cardId: string, boardId: string): Promise<CardRow> {
    const query = sql`
      UPDATE boards.cards
      SET archived_at = NULL, updated_at = now()
      WHERE id = ${cardId} AND board_id = ${boardId} AND archived_at IS NOT NULL
      RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
    `;
    const result = await this.pg.query<CardRow>(query);
    return result.rows[0];
  }

  async refreshProjections(): Promise<void> {
    try {
      await this.pg.query(
        sql`SELECT projections.refresh_mv_board_lane_counts()`,
      );
    } catch {
      // Ignore if view doesn't exist
    }
    try {
      await this.pg.query(sql`SELECT projections.refresh_mv_card_counters()`);
    } catch {
      // Ignore if view doesn't exist
    }
  }
}
