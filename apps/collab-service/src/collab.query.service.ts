import { Injectable } from '@nestjs/common';
import { TagsDao } from './tags/tags.dao';

/**
 * Query Service Pattern: Solo lecturas, sin side effects
 * Microservicios: Collab domain queries
 */

interface Tag {
  id: string;
  boardId: string;
  label: string;
  color: string | null;
}

@Injectable()
export class CollabQueryService {
  constructor(private readonly tagsDao: TagsDao) {}

  /**
   * Listar tags del board
   * TCP Contract: { cmd: 'tags.list' } → Tag[]
   */
  async listTags(params: { boardId: string }): Promise<Tag[]> {
    const tagRows = await this.tagsDao.tagsList(params.boardId);

    return tagRows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      label: row.label,
      color: row.color,
    }));
  }

  /**
   * Obtener tags de una card
   * TCP Contract: { cmd: 'tags.getCardTags' } → Tag[]
   */
  async getCardTags(params: { cardId: string }): Promise<Tag[]> {
    const tagRows = await this.tagsDao.getCardTags(params.cardId);
    return tagRows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      label: row.label,
      color: row.color,
    }));
  }
}
