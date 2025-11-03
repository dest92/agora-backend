import { Injectable } from '@nestjs/common';
import { PgService, sql } from '@app/lib-db';

/**
 * DAO Pattern: SQL parametrizado sin ORM
 * Singleton: PgService inyectado como @Global
 * Microservices: Sessions domain separation
 */

interface SessionRow {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
}

interface SessionParticipantRow {
  session_id: string;
  user_id: string;
  joined_at: string;
}

@Injectable()
export class SessionsDao {
  constructor(private readonly pg: PgService) {}

  /**
   * Crear sesión activa en workspace
   * Tabla: sessions.active_sessions (o sessions.sessions según esquema)
   */
  async createSession(workspaceId: string, title: string): Promise<SessionRow> {
    const query = sql`
      INSERT INTO sessions.sessions (workspace_id, title, created_at)
      VALUES (${workspaceId}, ${title}, NOW())
      RETURNING id, workspace_id, title, created_at
    `;
    const result = await this.pg.query<SessionRow>(query);
    return result.rows[0];
  }

  /**
   * Unirse a sesión (idempotente)
   * Tabla pivot: sessions.session_participants
   * ON CONFLICT DO NOTHING para idempotencia
   */
  async joinSession(sessionId: string, userId: string): Promise<SessionParticipantRow | null> {
    const query = sql`
      INSERT INTO sessions.session_participants (session_id, user_id, joined_at)
      VALUES (${sessionId}, ${userId}, NOW())
      ON CONFLICT (session_id, user_id) DO NOTHING
      RETURNING session_id, user_id, joined_at
    `;
    const result = await this.pg.query<SessionParticipantRow>(query);
    return result.rows[0] || null;
  }

  /**
   * Salir de sesión
   * DELETE para remover participación
   */
  async leaveSession(sessionId: string, userId: string): Promise<SessionParticipantRow | null> {
    const query = sql`
      DELETE FROM sessions.session_participants 
      WHERE session_id = ${sessionId} AND user_id = ${userId}
      RETURNING session_id, user_id, joined_at
    `;
    const result = await this.pg.query<SessionParticipantRow>(query);
    return result.rows[0] || null;
  }

  /**
   * Obtener participantes de sesión desde DB
   * Para sincronizar con Redis si es necesario
   */
  async getSessionParticipants(sessionId: string): Promise<string[]> {
    const query = sql`
      SELECT user_id
      FROM sessions.session_participants
      WHERE session_id = ${sessionId}
      ORDER BY joined_at ASC
    `;
    const result = await this.pg.query<{ user_id: string }>(query);
    return result.rows.map(row => row.user_id);
  }
}
