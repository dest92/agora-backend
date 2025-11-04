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
    return rows.map((row) => ({
      id: row.id,
      ownerId: row.created_by,
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
    const userIds = await this.sessionsDao.getSessionParticipants(
      params.sessionId,
    );

    return {
      users: userIds,
    };
  }

  /**
   * Listar miembros de un workspace con sus detalles de usuario
   * TCP Contract: { cmd: 'workspaces.listMembers' } → member details[]
   */
  async listWorkspaceMembers(params: { workspaceId: string }): Promise<any[]> {
    const members = await this.workspacesDao.listMembers(params.workspaceId);

    // El DAO ya devuelve los datos en camelCase, solo retornarlos
    return members;
  }

  /**
   * Listar workspaces donde el usuario es miembro (invitaciones)
   * TCP Contract: { cmd: 'workspaces.listInvites' } → invited workspaces[]
   */
  async listWorkspaceInvites(params: { userId: string }): Promise<any[]> {
    const memberships = await this.workspacesDao.listMembershipWorkspaces(
      params.userId,
    );

    // Transform to camelCase and flatten structure
    return memberships.map((membership) => ({
      workspaceId: membership.workspace_id,
      workspaceName: membership.workspaces?.name || 'Unknown',
      ownerId: membership.workspaces?.created_by || '',
      role: membership.role,
      joinedAt: membership.joined_at,
    }));
  }

  /**
   * Buscar usuarios por query (email o nombre)
   * TCP Contract: { cmd: 'workspaces.searchUsers' } → user[]
   */
  async searchUsers(params: {
    query: string;
  }): Promise<Array<{ id: string; email: string; name: string }>> {
    if (!params.query || params.query.trim().length < 2) {
      return [];
    }

    return await this.workspacesDao.searchUsers(params.query);
  }
}
