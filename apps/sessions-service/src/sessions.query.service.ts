import { Injectable } from '@nestjs/common';
import { WorkspacesDao } from './workspaces/workspaces.dao';
import { SessionsDao } from './sessions/sessions.dao';

/**
 * Query Service Pattern: Reads optimizadas
 * CQRS: Query side separado de commands
 * Microservices: Sessions domain queries
 */

interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

interface PresenceResult {
  users: string[];
}

@Injectable()
export class SessionsQueryService {
  constructor(
    private readonly workspacesDao: WorkspacesDao,
    private readonly sessionsDao: SessionsDao,
  ) {}

  /**
   * Listar workspaces del usuario
   * TCP Contract: { cmd: 'workspaces.list' } → Workspace[]
   * CQRS: Query optimizada para lectura
   */
  async listWorkspaces(params: { userId: string }): Promise<Workspace[]> {
    const rows = await this.workspacesDao.listWorkspaces(params.userId);

    // Map DB rows to domain objects
    return rows.map(row => ({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  /**
   * Obtener presence de sesión
   * TCP Contract: { cmd: 'sessions.presence' } → { users: string[] }
   * Por ahora desde DB, después se puede optimizar con Redis
   */
  async getPresence(params: { sessionId: string }): Promise<PresenceResult> {
    const userIds = await this.sessionsDao.getSessionParticipants(params.sessionId);

    return {
      users: userIds,
    };
  }
}
