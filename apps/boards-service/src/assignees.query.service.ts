import { Injectable } from '@nestjs/common';
import { AssigneesDao } from './assignees.dao';

@Injectable()
export class AssigneesQueryService {
  constructor(private readonly assigneesDao: AssigneesDao) {}

  /**
   * Get all assignees for a card
   */
  async getAssignees(cardId: string) {
    const assignees = await this.assigneesDao.getAssignees(cardId);
    return assignees.map((a) => ({
      userId: a.user_id,
      assignedAt: a.assigned_at,
    }));
  }

  /**
   * Get all cards assigned to a user
   */
  async getUserAssignments(userId: string) {
    const assignments = await this.assigneesDao.getUserAssignments(userId);
    return assignments.map((a) => ({
      cardId: a.card_id,
      assignedAt: a.assigned_at,
    }));
  }
}
