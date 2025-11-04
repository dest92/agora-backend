import { Injectable } from '@nestjs/common';
import { BoardsManagementDao } from './boards-management.dao';

export interface Board {
  id: string;
  workspaceId: string;
  teamId: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

@Injectable()
export class BoardsManagementCommandService {
  constructor(private readonly boardsManagementDao: BoardsManagementDao) {}

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
}
