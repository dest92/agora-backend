import { Injectable, Inject } from '@nestjs/common';
import { VotesDao } from './votes.dao';
import type { EventBus, DomainEvent } from '@app/lib-events/event-bus.port';

@Injectable()
export class VotesCommandService {
  constructor(
    private readonly dao: VotesDao,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  /**
   * Vote on a card (upvote or downvote)
   * If user already voted, it updates the vote
   * If user votes the same way again, it removes the vote (toggle)
   */
  async voteCard(
    cardId: string,
    boardId: string,
    voterId: string,
    voteType: 'up' | 'down',
  ) {
    const weight = voteType === 'up' ? 1 : -1;

    // Check if user already has a vote on this card
    const existingVote = await this.dao.getUserVote(cardId, voterId);

    let action: 'added' | 'removed' | 'changed';
    let finalWeight: number | null;

    if (existingVote) {
      if (existingVote.weight === weight) {
        // Same vote type - remove it (toggle off)
        await this.dao.removeVote(cardId, voterId);
        action = 'removed';
        finalWeight = null;
      } else {
        // Different vote type - update it
        await this.dao.upsertVote(cardId, voterId, weight);
        action = 'changed';
        finalWeight = weight;
      }
    } else {
      // No existing vote - add it
      await this.dao.upsertVote(cardId, voterId, weight);
      action = 'added';
      finalWeight = weight;
    }

    // Get updated vote summary
    const summary = await this.dao.getVoteSummary(cardId);

    // Emit event
    const event: DomainEvent = {
      name: 'vote:changed',
      payload: {
        cardId,
        voterId,
        voteType: finalWeight === 1 ? 'up' : finalWeight === -1 ? 'down' : null,
        action,
        summary: {
          upvotes: summary.upvotes,
          downvotes: summary.downvotes,
          total: summary.total,
        },
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return {
      action,
      voteType: finalWeight === 1 ? 'up' : finalWeight === -1 ? 'down' : null,
      summary,
    };
  }

  /**
   * Remove a user's vote from a card
   */
  async removeVote(cardId: string, boardId: string, voterId: string) {
    await this.dao.removeVote(cardId, voterId);

    // Get updated vote summary
    const summary = await this.dao.getVoteSummary(cardId);

    // Emit event
    const event: DomainEvent = {
      name: 'vote:removed',
      payload: {
        cardId,
        voterId,
        summary: {
          upvotes: summary.upvotes,
          downvotes: summary.downvotes,
          total: summary.total,
        },
      },
      meta: {
        boardId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.eventBus.publish(event);

    return { summary };
  }
}
