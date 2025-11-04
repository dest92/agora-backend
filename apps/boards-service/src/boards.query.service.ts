import { Injectable } from '@nestjs/common';
import { BoardsDao } from './boards.dao';

@Injectable()
export class BoardsQueryService {
  constructor(private readonly dao: BoardsDao) {}

  async listCards(boardId: string, laneId?: string) {
    const rows = await this.dao.listCards(boardId, laneId);
    return rows.map((row) => this.mapToCard(row));
  }

  async listComments(cardId: string) {
    const rows = await this.dao.listComments(cardId);
    return rows.map((row) => this.mapToComment(row));
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

  private mapToComment(row: any) {
    return {
      id: row.id,
      cardId: row.card_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
    };
  }
}
