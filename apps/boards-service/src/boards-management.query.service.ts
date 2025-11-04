import { Injectable } from '@nestjs/common';
import { BoardsManagementDao } from './boards-management.dao';
import { Board } from './boards-management.command.service';

export interface Lane {
  id: string;
  boardId: string;
  name: string;
  position: number;
}

@Injectable()
export class BoardsManagementQueryService {
  constructor(private readonly boardsManagementDao: BoardsManagementDao) {}

  async listBoards(workspaceId: string, userId?: string): Promise<Board[]> {
    // Verify access if userId is provided
    if (userId) {
      const hasAccess = await this.boardsManagementDao.hasWorkspaceAccess(
        workspaceId,
        userId,
      );
      if (!hasAccess) {
        throw new Error(
          'Access denied: User is not a member of this workspace',
        );
      }
    }

    const rows = await this.boardsManagementDao.listBoards(workspaceId);

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      teamId: row.team_id,
      title: row.title,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async getBoard(boardId: string): Promise<Board | null> {
    const row = await this.boardsManagementDao.getBoard(boardId);

    if (!row) return null;

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      teamId: row.team_id,
      title: row.title,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  async getLanes(boardId: string): Promise<Lane[]> {
    const rows = await this.boardsManagementDao.getLanes(boardId);

    return rows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      name: row.name,
      position: row.position,
    }));
  }
}
