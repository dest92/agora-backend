import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SessionsCommandService } from './sessions.command.service';
import { SessionsQueryService } from './sessions.query.service';

/**
 * TCP Controller Pattern: @MessagePattern handlers
 * Microservices: Sessions service TCP endpoints
 * Cliente-Servidor: Gateway HTTP → Sessions TCP
 */

@Controller()
export class SessionsController {
  constructor(
    private readonly commandService: SessionsCommandService,
    private readonly queryService: SessionsQueryService,
  ) {}

  /**
   * TCP Contract: workspaces.create
   * Gateway → { cmd: 'workspaces.create', ownerId, name }
   */
  @MessagePattern({ cmd: 'workspaces.create' })
  async createWorkspace(data: { ownerId: string; name: string }) {
    return this.commandService.createWorkspace(data);
  }

  /**
   * TCP Contract: workspaces.list
   * Gateway → { cmd: 'workspaces.list', userId }
   */
  @MessagePattern({ cmd: 'workspaces.list' })
  async listWorkspaces(data: { userId: string }) {
    return this.queryService.listWorkspaces(data);
  }

  /**
   * TCP Contract: workspaces.addMember
   * Gateway → { cmd: 'workspaces.addMember', workspaceId, userId, addedBy }
   */
  @MessagePattern({ cmd: 'workspaces.addMember' })
  async addMember(data: {
    workspaceId: string;
    userId: string;
    addedBy: string;
  }) {
    return this.commandService.addWorkspaceMember(data);
  }

  /**
   * TCP Contract: workspaces.listMembers
   * Gateway → { cmd: 'workspaces.listMembers', workspaceId }
   */
  @MessagePattern({ cmd: 'workspaces.listMembers' })
  async listMembers(data: { workspaceId: string }) {
    return this.queryService.listWorkspaceMembers(data);
  }

  @MessagePattern({ cmd: 'workspaces.listInvites' })
  async listInvites(data: { userId: string }) {
    return this.queryService.listWorkspaceInvites(data);
  }

  /**
   * TCP Contract: workspaces.searchUsers
   * Gateway → { cmd: 'workspaces.searchUsers', query }
   */
  @MessagePattern({ cmd: 'workspaces.searchUsers' })
  async searchUsers(data: { query: string }) {
    return this.queryService.searchUsers(data);
  }

  /**
   * TCP Contract: workspaces.updateMemberRole
   * Gateway → { cmd: 'workspaces.updateMemberRole', workspaceId, userId, role, requestedBy }
   */
  @MessagePattern({ cmd: 'workspaces.updateMemberRole' })
  async updateMemberRole(data: {
    workspaceId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    requestedBy: string;
  }) {
    return this.commandService.updateMemberRole(data);
  }

  /**
   * TCP Contract: workspaces.delete
   * Gateway → { cmd: 'workspaces.delete', workspaceId, requestedBy }
   */
  @MessagePattern({ cmd: 'workspaces.delete' })
  async deleteWorkspace(data: { workspaceId: string; requestedBy: string }) {
    return this.commandService.deleteWorkspace(data);
  }

  /**
   * TCP Contract: sessions.create
   * Gateway → { cmd: 'sessions.create', workspaceId, title }
   */
  @MessagePattern({ cmd: 'sessions.create' })
  async createSession(data: { workspaceId: string; title: string }) {
    return this.commandService.createSession(data);
  }

  /**
   * TCP Contract: sessions.join
   * Gateway → { cmd: 'sessions.join', sessionId, userId, workspaceId? }
   */
  @MessagePattern({ cmd: 'sessions.join' })
  async joinSession(data: {
    sessionId: string;
    userId: string;
    workspaceId?: string;
  }) {
    return this.commandService.joinSession(data);
  }

  /**
   * TCP Contract: sessions.leave
   * Gateway → { cmd: 'sessions.leave', sessionId, userId, workspaceId? }
   */
  @MessagePattern({ cmd: 'sessions.leave' })
  async leaveSession(data: {
    sessionId: string;
    userId: string;
    workspaceId?: string;
  }) {
    return this.commandService.leaveSession(data);
  }

  /**
   * TCP Contract: sessions.presence
   * Gateway → { cmd: 'sessions.presence', sessionId }
   */
  @MessagePattern({ cmd: 'sessions.presence' })
  async getPresence(@Payload() data: { sessionId: string }) {
    return this.queryService.getPresence(data);
  }

  /**
   * Hardening: Health Check Handler
   * Microservicios: TCP health.ping response
   */
  @MessagePattern({ cmd: 'health.ping' })
  healthPing(): { ok: boolean } {
    return { ok: true };
  }
}
