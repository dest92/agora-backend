import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CollabQueryService } from './collab.query.service';
import { CollabCommandService } from './collab.command.service';

/**
 * Microservices Pattern: TCP @MessagePattern controller
 * Cliente-Servidor: Gateway HTTP → Collab TCP
 */

@Controller()
export class CollabController {
  constructor(
    private readonly queryService: CollabQueryService,
    private readonly commandService: CollabCommandService,
  ) {}

  /**
   * TCP Contract: tags.create
   * Gateway → { cmd: 'tags.create', boardId, label, color? }
   */
  @MessagePattern({ cmd: 'tags.create' })
  async createTag(data: { boardId: string; label: string; color?: string }) {
    return this.commandService.createTag(data);
  }

  /**
   * TCP Contract: tags.list
   * Gateway → { cmd: 'tags.list', boardId }
   */
  @MessagePattern({ cmd: 'tags.list' })
  async listTags(data: { boardId: string }) {
    return this.queryService.listTags(data);
  }

  /**
   * TCP Contract: tags.getCardTags
   * Gateway → { cmd: 'tags.getCardTags', cardId }
   */
  @MessagePattern({ cmd: 'tags.getCardTags' })
  async getCardTags(data: { cardId: string }) {
    return this.queryService.getCardTags(data);
  }

  /**
   * TCP Contract: tags.assign
   * Gateway → { cmd: 'tags.assign', boardId, cardId, tagId }
   */
  @MessagePattern({ cmd: 'tags.assign' })
  async assignTag(data: { boardId: string; cardId: string; tagId: string }) {
    return this.commandService.assignTag(data);
  }

  /**
   * TCP Contract: tags.unassign
   * Gateway → { cmd: 'tags.unassign', boardId, cardId, tagId }
   */
  @MessagePattern({ cmd: 'tags.unassign' })
  async unassignTag(data: { boardId: string; cardId: string; tagId: string }) {
    return this.commandService.unassignTag(data);
  }

  /**
   * TCP Contract: assignees.add
   * Gateway → { cmd: 'assignees.add', boardId, cardId, userId }
   */
  @MessagePattern({ cmd: 'assignees.add' })
  async addAssignee(data: { boardId: string; cardId: string; userId: string }) {
    return this.commandService.assigneeAdd(data);
  }

  /**
   * TCP Contract: assignees.remove
   * Gateway → { cmd: 'assignees.remove', boardId, cardId, userId }
   */
  @MessagePattern({ cmd: 'assignees.remove' })
  async removeAssignee(data: {
    boardId: string;
    cardId: string;
    userId: string;
  }) {
    return this.commandService.assigneeRemove(data);
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
