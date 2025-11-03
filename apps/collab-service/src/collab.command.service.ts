import { Injectable, Inject } from '@nestjs/common';
import type { EventBus, DomainEvent } from '@app/lib-events';
import { TagsDao } from './tags/tags.dao';
import { AssigneesDao } from './assignees/assignees.dao';

/**
 * Command Service Pattern: Writes + Domain Events
 * EDA: Publica eventos después del write
 * Observer: EventBus notifica a Gateway → Socket.IO
 */

interface Tag {
  id: string;
  boardId: string;
  label: string;
  color: string | null;
}

interface TagAssignResult {
  assigned: boolean;
}

interface TagUnassignResult {
  unassigned: boolean;
}

interface AssigneeAddResult {
  assigned: boolean;
}

interface AssigneeRemoveResult {
  removed: boolean;
}

@Injectable()
export class CollabCommandService {
  constructor(
    private readonly tagsDao: TagsDao,
    private readonly assigneesDao: AssigneesDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  /**
   * Crear tag con evento de dominio
   * TCP Contract: { cmd: 'tags.create' } → Tag
   * Domain Event: tag:created
   */
  async createTag(params: {
    boardId: string;
    label: string;
    color?: string;
  }): Promise<Tag> {
    // Write to DB
    const tagRow = await this.tagsDao.tagsCreate(
      params.boardId,
      params.label,
      params.color,
    );

    const tag: Tag = {
      id: tagRow.id,
      boardId: tagRow.board_id,
      label: tagRow.label,
      color: tagRow.color,
    };

    // EDA: Publish domain event after successful write
    const event: DomainEvent = {
      name: 'tag:created',
      payload: {
        tagId: tag.id,
        boardId: tag.boardId,
        label: tag.label,
        color: tag.color,
      },
      meta: {
        boardId: tag.boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return tag;
  }

  /**
   * Asignar tag a card con evento de dominio
   * TCP Contract: { cmd: 'tags.assign' } → { assigned: boolean }
   * Domain Event: tag:assigned (solo si realmente se asignó)
   */
  async assignTag(params: {
    boardId: string;
    cardId: string;
    tagId: string;
  }): Promise<TagAssignResult> {
    // Write to DB (idempotent with ON CONFLICT DO NOTHING)
    const result = await this.tagsDao.tagAssign(params.cardId, params.tagId);

    // Solo publicar evento si realmente se asignó (no era duplicado)
    if (result) {
      const event: DomainEvent = {
        name: 'tag:assigned',
        payload: {
          tagId: params.tagId,
          cardId: params.cardId,
          boardId: params.boardId,
        },
        meta: {
          boardId: params.boardId,
          occurredAt: new Date().toISOString(),
        },
      };

      await this.eventBus.publish(event);
    }

    return { assigned: true };
  }

  /**
   * Desasignar tag de card con evento de dominio
   * TCP Contract: { cmd: 'tags.unassign' } → { unassigned: boolean }
   * Domain Event: tag:unassigned
   */
  async unassignTag(params: {
    boardId: string;
    cardId: string;
    tagId: string;
  }): Promise<TagUnassignResult> {
    // Write to DB
    await this.tagsDao.tagUnassign(params.cardId, params.tagId);

    // EDA: Publish domain event
    const event: DomainEvent = {
      name: 'tag:unassigned',
      payload: {
        tagId: params.tagId,
        cardId: params.cardId,
        boardId: params.boardId,
      },
      meta: {
        boardId: params.boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return { unassigned: true };
  }

  /**
   * Asignar usuario a card con evento de dominio
   * TCP Contract: { cmd: 'assignees.add' } → { assigned: boolean }
   * Domain Event: assignee:added (solo si realmente se asignó)
   */
  async assigneeAdd(params: {
    boardId: string;
    cardId: string;
    userId: string;
  }): Promise<AssigneeAddResult> {
    // Write to DB (idempotent with ON CONFLICT DO NOTHING)
    const result = await this.assigneesDao.assign(params.cardId, params.userId);

    // Solo publicar evento si realmente se asignó (no era duplicado)
    if (result) {
      const event: DomainEvent = {
        name: 'assignee:added',
        payload: {
          cardId: params.cardId,
          userId: params.userId,
          boardId: params.boardId,
        },
        meta: {
          boardId: params.boardId,
          occurredAt: new Date().toISOString(),
        },
      };

      await this.eventBus.publish(event);
    }

    return { assigned: true };
  }

  /**
   * Desasignar usuario de card con evento de dominio
   * TCP Contract: { cmd: 'assignees.remove' } → { removed: boolean }
   * Domain Event: assignee:removed
   */
  async assigneeRemove(params: {
    boardId: string;
    cardId: string;
    userId: string;
  }): Promise<AssigneeRemoveResult> {
    // Write to DB
    const result = await this.assigneesDao.unassign(params.cardId, params.userId);

    // Solo publicar evento si realmente se removió algo
    if (result) {
      const event: DomainEvent = {
        name: 'assignee:removed',
        payload: {
          cardId: params.cardId,
          userId: params.userId,
          boardId: params.boardId,
        },
        meta: {
          boardId: params.boardId,
          occurredAt: new Date().toISOString(),
        },
      };

      await this.eventBus.publish(event);
    }

    return { removed: true };
  }
}
