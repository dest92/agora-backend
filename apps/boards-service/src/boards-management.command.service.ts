import { Injectable, Inject } from '@nestjs/common';
import { BoardsManagementDao } from './boards-management.dao';
import type { EventBus, DomainEvent } from '@app/lib-events/event-bus.port';

export interface Board {
  id: string;
  workspaceId: string;
  teamId: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export interface Lane {
  id: string;
  boardId: string;
  name: string;
  position: number;
}

@Injectable()
export class BoardsManagementCommandService {
  constructor(
    private readonly boardsManagementDao: BoardsManagementDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async createBoard(params: {
    workspaceId: string;
    title: string;
    createdBy: string;
  }): Promise<Board> {
    const row = await this.boardsManagementDao.createBoard(
      params.workspaceId,
      params.title,
      params.createdBy,
    );

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      teamId: row.team_id,
      title: row.title,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  async createLane(params: { boardId: string; name: string }): Promise<Lane> {
    const row = await this.boardsManagementDao.createLane(
      params.boardId,
      params.name,
    );

    const lane: Lane = {
      id: row.id,
      boardId: row.board_id,
      name: row.name,
      position: row.position,
    };

    // Emit WebSocket event
    const event: DomainEvent = {
      name: 'lane:created',
      payload: {
        laneId: lane.id,
        boardId: lane.boardId,
        name: lane.name,
        position: lane.position,
      },
      meta: {
        boardId: lane.boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return lane;
  }

  async updateLanePosition(params: {
    laneId: string;
    position: number;
  }): Promise<{ updated: boolean }> {
    const { boardId } = await this.boardsManagementDao.updateLanePosition(
      params.laneId,
      params.position,
    );

    // Emit WebSocket event
    const event: DomainEvent = {
      name: 'lane:updated',
      payload: {
        laneId: params.laneId,
        boardId,
        position: params.position,
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return { updated: true };
  }

  async deleteLane(params: { laneId: string }): Promise<{ deleted: boolean }> {
    const { boardId } = await this.boardsManagementDao.deleteLane(
      params.laneId,
    );

    // Emit WebSocket event
    const event: DomainEvent = {
      name: 'lane:deleted',
      payload: {
        laneId: params.laneId,
        boardId,
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return { deleted: true };
  }
}
