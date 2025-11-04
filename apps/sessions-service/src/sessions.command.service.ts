import { Injectable, Inject } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events';
import { WorkspacesDao } from './workspaces/workspaces.dao';
import { SessionsDao } from './sessions/sessions.dao';

/**
 * Command Service Pattern: Writes + Domain Events
 * EDA: Publica eventos después del write
 * Observer: EventBus notifica a Gateway → Socket.IO
 * CQRS: Command side con writes + events
 */

interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

interface Session {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
}

interface JoinResult {
  joined: boolean;
}

interface LeaveResult {
  left: boolean;
}

@Injectable()
export class SessionsCommandService {
  constructor(
    private readonly workspacesDao: WorkspacesDao,
    private readonly sessionsDao: SessionsDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  /**
   * Crear workspace con evento de dominio
   * TCP Contract: { cmd: 'workspaces.create' } → Workspace
   * Domain Event: workspace:created
   */
  async createWorkspace(params: {
    ownerId: string;
    name: string;
  }): Promise<Workspace> {
    // Write to DB
    const row = await this.workspacesDao.createWorkspace(
      params.ownerId,
      params.name,
    );

    // Map DB row to domain object
    const workspace: Workspace = {
      id: row.id,
      ownerId: row.created_by,
      name: row.name,
      createdAt: row.created_at,
    };

    // Publish domain event
    const event: DomainEvent = {
      name: 'workspace:created',
      payload: {
        workspaceId: workspace.id,
        ownerId: workspace.ownerId,
        name: workspace.name,
      },
      meta: {
        workspaceId: workspace.id,
        occurredAt: new Date().toISOString(),
      } as any,
    };

    await this.eventBus.publish(event);

    return workspace;
  }

  /**
   * Agregar miembro a workspace
   * TCP Contract: { cmd: 'workspaces.addMember' } → { added: boolean }
   * Domain Event: workspace:memberAdded
   * Acepta userId (UUID) o email
   */
  async addWorkspaceMember(params: {
    workspaceId: string;
    userId: string;
    addedBy: string;
  }): Promise<{ added: boolean }> {
    let targetUserId = params.userId;

    // Check if userId is actually an email
    const isEmail = params.userId.includes('@');

    if (isEmail) {
      // Look up user by email
      const foundUserId = await this.workspacesDao.findUserByEmail(
        params.userId,
      );

      if (!foundUserId) {
        throw new Error(`User with email ${params.userId} not found`);
      }

      targetUserId = foundUserId;
    }

    // Write to DB
    await this.workspacesDao.addMember(
      params.workspaceId,
      targetUserId,
      params.addedBy,
    );

    // Publish domain event
    const event: DomainEvent = {
      name: 'workspace:memberAdded',
      payload: {
        workspaceId: params.workspaceId,
        userId: targetUserId,
        addedBy: params.addedBy,
      },
      meta: {
        workspaceId: params.workspaceId,
        occurredAt: new Date().toISOString(),
      } as any,
    };

    await this.eventBus.publish(event);

    return { added: true };
  }

  /**
   * Crear sesión con evento de dominio
   * TCP Contract: { cmd: 'sessions.create' } → Session
   * Domain Event: session:created
   */
  async createSession(params: {
    workspaceId: string;
    title: string;
  }): Promise<Session> {
    // Write to DB
    const row = await this.sessionsDao.createSession(
      params.workspaceId,
      params.title,
    );

    // Map DB row to domain object
    const session: Session = {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      createdAt: row.created_at,
    };

    // Publish domain event
    const event: DomainEvent = {
      name: 'session:created',
      payload: {
        sessionId: session.id,
        workspaceId: session.workspaceId,
        title: session.title,
      },
      meta: {
        workspaceId: session.workspaceId,
        occurredAt: new Date().toISOString(),
      } as any,
    };

    await this.eventBus.publish(event);

    return session;
  }

  /**
   * Unirse a sesión
   * TCP Contract: { cmd: 'sessions.join' } → { joined: boolean }
   * Domain Event: session:user_joined (solo si realmente se unió)
   */
  async joinSession(params: {
    sessionId: string;
    userId: string;
    workspaceId?: string;
  }): Promise<JoinResult> {
    // Write to DB (idempotent with ON CONFLICT DO NOTHING)
    const dbResult = await this.sessionsDao.joinSession(
      params.sessionId,
      params.userId,
    );

    // Solo publicar evento si realmente se unió (no era duplicado)
    if (dbResult) {
      const event: DomainEvent = {
        name: 'session:user_joined',
        payload: {
          sessionId: params.sessionId,
          userId: params.userId,
          workspaceId: params.workspaceId,
        },
        meta: {
          workspaceId: params.workspaceId,
          occurredAt: new Date().toISOString(),
        } as any,
      };

      await this.eventBus.publish(event);
    }

    return { joined: true };
  }

  /**
   * Salir de sesión
   * TCP Contract: { cmd: 'sessions.leave' } → { left: boolean }
   * Domain Event: session:user_left
   */
  async leaveSession(params: {
    sessionId: string;
    userId: string;
    workspaceId?: string;
  }): Promise<LeaveResult> {
    // Write to DB
    const dbResult = await this.sessionsDao.leaveSession(
      params.sessionId,
      params.userId,
    );

    // Solo publicar evento si realmente se removió algo
    if (dbResult) {
      const event: DomainEvent = {
        name: 'session:user_left',
        payload: {
          sessionId: params.sessionId,
          userId: params.userId,
          workspaceId: params.workspaceId,
        },
        meta: {
          workspaceId: params.workspaceId,
          occurredAt: new Date().toISOString(),
        } as any,
      };

      await this.eventBus.publish(event);
    }

    return { left: true };
  }

  /**
   * Actualizar rol de miembro del workspace
   * CQRS Command: updateMemberRole
   * Solo owners pueden cambiar roles
   */
  async updateMemberRole(params: {
    workspaceId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    requestedBy: string;
  }): Promise<{ updated: boolean }> {
    // Verificar que el usuario solicitante sea owner
    const isOwner = await this.workspacesDao.isWorkspaceOwner(
      params.workspaceId,
      params.requestedBy,
    );

    if (!isOwner) {
      throw new Error('Only workspace owners can change member roles');
    }

    // Actualizar el rol
    await this.workspacesDao.updateMemberRole(
      params.workspaceId,
      params.userId,
      params.role,
    );

    // Publicar evento de dominio
    const event: DomainEvent = {
      name: 'workspace:member_role_changed',
      payload: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        newRole: params.role,
        changedBy: params.requestedBy,
      },
      meta: {
        workspaceId: params.workspaceId,
        occurredAt: new Date().toISOString(),
      } as any,
    };

    await this.eventBus.publish(event);

    return { updated: true };
  }
}
