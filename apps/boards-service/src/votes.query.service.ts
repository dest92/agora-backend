import { Injectable } from '@nestjs/common';
import { VotesDao } from './votes.dao';

@Injectable()
export class VotesQueryService {
  constructor(private readonly dao: VotesDao) {}

  /**
   * Get vote summary for a card
   */
  async getVoteSummary(cardId: string) {
    const summary = await this.dao.getVoteSummary(cardId);
    return summary;
  }

  /**
   * Get all voters for a card
   */
  async getVoters(cardId: string) {
    const voters = await this.dao.getVoters(cardId);
    return voters;
  }

  /**
   * Get user's vote on a card
   */
  async getUserVote(cardId: string, voterId: string) {
    const vote = await this.dao.getUserVote(cardId, voterId);
    if (!vote) {
      return null;
    }
    return {
      voteType: vote.weight > 0 ? 'up' : 'down',
      weight: vote.weight,
      createdAt: vote.created_at,
    };
  }
}
