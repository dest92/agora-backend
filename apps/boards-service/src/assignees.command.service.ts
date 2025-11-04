import { Injectable, Inject } from '@nestjs/common';
import { AssigneesDao } from './assignees.dao';
import type { EventBus, DomainEvent } from '@app/lib-events/event-bus.port';

@Injectable()
export class AssigneesCommandService {
  constructor(
    private readonly assigneesDao: AssigneesDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  /**
   * Assign a user to a card
   * Emits assignee:added event
   */
  async assignUser(cardId: string, userId: string, boardId: string) {
    console.log('➕ [COMMAND] Assigning user:', { cardId, userId, boardId });

    // Check if already assigned
    const isAssigned = await this.assigneesDao.isUserAssigned(cardId, userId);
    if (isAssigned) {
      console.log('ℹ️ [COMMAND] User already assigned to card');
      return {
        message: 'User is already assigned to this card',
        alreadyAssigned: true,
      };
    }

    // Assign user
    const assignment = await this.assigneesDao.assignUser(cardId, userId);
    console.log('✅ [COMMAND] User assigned successfully:', assignment);

    // Emit WebSocket event
    const event: DomainEvent = {
      name: 'assignee:added',
      payload: {
        cardId,
        userId,
        assignedAt: assignment.assigned_at,
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return {
      message: 'User assigned successfully',
      assignment,
    };
  }

  /**
   * Unassign a user from a card
   * Emits assignee:removed event
   */
  async unassignUser(cardId: string, userId: string, boardId: string) {
    // Check if actually assigned
    const isAssigned = await this.assigneesDao.isUserAssigned(cardId, userId);
    if (!isAssigned) {
      return {
        message: 'User is not assigned to this card',
        notAssigned: true,
      };
    }

    // Unassign user
    await this.assigneesDao.unassignUser(cardId, userId);

    // Emit WebSocket event
    const event: DomainEvent = {
      name: 'assignee:removed',
      payload: {
        cardId,
        userId,
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return {
      message: 'User unassigned successfully',
    };
  }
}
