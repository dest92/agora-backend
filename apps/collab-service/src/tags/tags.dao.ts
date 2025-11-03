import { Injectable } from '@nestjs/common';
import { PgService, sql } from '@app/lib-db';

/**
 * DAO Pattern: SQL parametrizado sin ORM
 * Singleton: PgService inyectado como @Global
 */

interface TagRow {
  id: string;
  board_id: string;
  label: string;
  color: string | null;
}

interface CardTagRow {
  card_id: string;
  tag_id: string;
}

@Injectable()
export class TagsDao {
  constructor(private readonly pg: PgService) {}

  /**
   * Crear tag con ON CONFLICT para unicidad por (board_id, label)
   * Patrón: Upsert con COALESCE para preservar color existente
   */
  async tagsCreate(
    boardId: string,
    label: string,
    color?: string,
  ): Promise<TagRow> {
    const query = sql`
      INSERT INTO boards.tags (board_id, label, color)
      VALUES (${boardId}, ${label}, ${color || null})
      ON CONFLICT (board_id, label) DO UPDATE
      SET color = COALESCE(EXCLUDED.color, boards.tags.color)
      RETURNING id, board_id, label, color
    `;
    const result = await this.pg.query<TagRow>(query);
    return result.rows[0];
  }

  /**
   * Listar tags del board ordenados alfabéticamente
   */
  async tagsList(boardId: string): Promise<TagRow[]> {
    const query = sql`
      SELECT id, board_id, label, color
      FROM boards.tags
      WHERE board_id = ${boardId}
      ORDER BY label ASC
    `;
    const result = await this.pg.query<TagRow>(query);
    return result.rows;
  }

  /**
   * Asignar tag a card con ON CONFLICT DO NOTHING para idempotencia
   * Patrón: Pivot table con constraint unique(card_id, tag_id)
   */
  async tagAssign(cardId: string, tagId: string): Promise<CardTagRow | null> {
    const query = sql`
      INSERT INTO boards.card_tags (card_id, tag_id)
      VALUES (${cardId}, ${tagId})
      ON CONFLICT (card_id, tag_id) DO NOTHING
      RETURNING card_id, tag_id
    `;
    const result = await this.pg.query<CardTagRow>(query);
    return result.rows[0] || null;
  }

  /**
   * Desasignar tag de card
   */
  async tagUnassign(cardId: string, tagId: string): Promise<void> {
    const query = sql`
      DELETE FROM boards.card_tags 
      WHERE card_id = ${cardId} AND tag_id = ${tagId}
    `;
    await this.pg.query(query);
  }
}
