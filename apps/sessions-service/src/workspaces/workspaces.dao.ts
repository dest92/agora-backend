import { Injectable } from '@nestjs/common';
import { PgService, sql } from '@app/lib-db';

/**
 * DAO Pattern: SQL parametrizado sin ORM
 * Singleton: PgService inyectado como @Global
 * Microservices: Sessions domain separation
 */

interface WorkspaceRow {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

@Injectable()
export class WorkspacesDao {
  constructor(private readonly pg: PgService) {}

  /**
   * Crear workspace con owner
   * Tabla: boards.workspaces (siguiendo esquema existente)
   */
  async createWorkspace(ownerId: string, name: string): Promise<WorkspaceRow> {
    const query = sql`
      INSERT INTO boards.workspaces (owner_id, name, created_at)
      VALUES (${ownerId}, ${name}, NOW())
      RETURNING id, owner_id, name, created_at
    `;
    const result = await this.pg.query<WorkspaceRow>(query);
    return result.rows[0];
  }

  /**
   * Listar workspaces donde el usuario es owner o member
   * CQRS: Query optimizada para lectura
   */
  async listWorkspaces(userId: string): Promise<WorkspaceRow[]> {
    const query = sql`
      SELECT DISTINCT w.id, w.owner_id, w.name, w.created_at
      FROM boards.workspaces w
      WHERE w.owner_id = ${userId}
         OR EXISTS (
           SELECT 1 FROM boards.workspace_members wm 
           WHERE wm.workspace_id = w.id AND wm.user_id = ${userId}
         )
      ORDER BY w.created_at DESC
    `;
    const result = await this.pg.query<WorkspaceRow>(query);
    return result.rows;
  }
}
