import { Injectable } from '@nestjs/common';
import { PgService, sql } from '@app/lib-db';

/**
 * DAO Pattern: SQL parametrizado sin ORM
 * Singleton: PgService inyectado como @Global
 */

interface CardAssigneeRow {
  card_id: string;
  user_id: string;
  assigned_at: string;
}

@Injectable()
export class AssigneesDao {
  constructor(private readonly pg: PgService) {}

  /**
   * Asignar usuario a card con ON CONFLICT DO NOTHING para idempotencia
   * Patrón: PK compuesta (card_id, user_id) con constraint
   */
  async assign(cardId: string, userId: string): Promise<CardAssigneeRow | null> {
    const query = sql`
      INSERT INTO boards.card_assignees (card_id, user_id, assigned_at)
      VALUES (${cardId}, ${userId}, NOW())
      ON CONFLICT (card_id, user_id) DO NOTHING
      RETURNING card_id, user_id, assigned_at
    `;
    const result = await this.pg.query<CardAssigneeRow>(query);
    return result.rows[0] || null;
  }

  /**
   * Desasignar usuario de card
   * Retorna la fila eliminada para confirmar la operación
   */
  async unassign(cardId: string, userId: string): Promise<CardAssigneeRow | null> {
    const query = sql`
      DELETE FROM boards.card_assignees 
      WHERE card_id = ${cardId} AND user_id = ${userId}
      RETURNING card_id, user_id, assigned_at
    `;
    const result = await this.pg.query<CardAssigneeRow>(query);
    return result.rows[0] || null;
  }
}
