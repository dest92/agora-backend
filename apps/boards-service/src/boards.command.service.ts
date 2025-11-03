import { Injectable, Inject } from '@nestjs/common';
import { BoardsDao } from './boards.dao';
import type { EventBus, DomainEvent } from '@app/lib-events/event-bus.port';

@Injectable()
export class BoardsCommandService {
  constructor(
    private readonly dao: BoardsDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async createCard(input: {
    boardId: string;
    authorId: string;
    content: string;
    priority: string;
    position: number;
    laneId?: string;
  }) {
    const card = await this.dao.createCard(input);

    const event: DomainEvent = {
      name: 'card:created',
      payload: {
        cardId: card.id,
        boardId: card.board_id,
        content: card.content,
        authorId: card.author_id,
        priority: card.priority,
        position: card.position,
        createdAt: card.created_at.toISOString(),
      },
      meta: {
        boardId: card.board_id,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return this.mapToCard(card);
  }

  async updateCard(
    cardId: string,
    boardId: string,
    updates: {
      content?: string;
      laneId?: string;
      priority?: string;
      position?: number;
    },
  ) {
    const { previousLaneId, card } = await this.dao.updateCard(
      cardId,
      boardId,
      updates,
    );

    const eventName =
      updates.laneId && updates.laneId !== previousLaneId
        ? 'card:moved'
        : 'card:updated';

    const event: DomainEvent = {
      name: eventName,
      payload: {
        cardId: card.id,
        boardId: card.board_id,
        laneId: card.lane_id,
        priority: card.priority,
        position: card.position,
        content: card.content,
        archived: false,
        updatedAt: card.updated_at.toISOString(),
      },
      meta: {
        boardId: card.board_id,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return this.mapToCard(card);
  }

  async archiveCard(cardId: string, boardId: string) {
    const card = await this.dao.archiveCard(cardId, boardId);

    const event: DomainEvent = {
      name: 'card:archived',
      payload: {
        cardId: card.id,
        boardId: card.board_id,
        laneId: card.lane_id,
        priority: card.priority,
        position: card.position,
        archived: true,
        updatedAt: card.archived_at?.toISOString(),
      },
      meta: {
        boardId: card.board_id,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return this.mapToCard(card);
  }

  async unarchiveCard(cardId: string, boardId: string) {
    const card = await this.dao.unarchiveCard(cardId, boardId);

    const event: DomainEvent = {
      name: 'card:unarchived',
      payload: {
        cardId: card.id,
        boardId: card.board_id,
        laneId: card.lane_id,
        priority: card.priority,
        position: card.position,
        archived: false,
        updatedAt: card.updated_at.toISOString(),
      },
      meta: {
        boardId: card.board_id,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);
    return this.mapToCard(card);
  }

  async refreshProjections() {
    await this.dao.refreshProjections();
    return { refreshed: true };
  }

  private mapToCard(row: any) {
    return {
      id: row.id,
      boardId: row.board_id,
      authorId: row.author_id,
      content: row.content,
      laneId: row.lane_id,
      priority: row.priority,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }
}
