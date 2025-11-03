import { Injectable } from '@nestjs/common';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';
import { sql } from '../shared/database/sql';

export type VoteKind = 'up' | 'down';

export interface Vote {
  id: string;
  cardId: string;
  voterId: string;
  kind: VoteKind;
  createdAt: Date;
}

interface VoteRow {
  id: string;
  card_id: string;
  voter_id: string;
  kind: VoteKind;
  created_at: Date;
}

/**
 * Service for managing card votes
 */
@Injectable()
export class VotesService {
  constructor(
    private readonly pg: PgService,
    private readonly realtime: RealtimeService,
  ) {}

  async castVote(
    cardId: string,
    voterId: string,
    kind: VoteKind,
    boardId: string,
  ): Promise<Vote> {
    const query = sql`
      INSERT INTO boards.votes (card_id, voter_id, kind)
      VALUES (${cardId}, ${voterId}, ${kind})
      ON CONFLICT (card_id, voter_id) DO UPDATE SET kind = EXCLUDED.kind
      RETURNING id, card_id, voter_id, kind, created_at
    `;
    const result = await this.pg.query<VoteRow>(query);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to cast vote');
    }
    const vote = this.mapRowToVote(row);
    await this.realtime.publish(`room:board:${boardId}`, 'vote:cast', {
      cardId: vote.cardId,
      voterId: vote.voterId,
      kind: vote.kind,
    });
    return vote;
  }

  async removeVote(
    cardId: string,
    voterId: string,
    boardId: string,
  ): Promise<void> {
    const query = sql`
      DELETE FROM boards.votes WHERE card_id = ${cardId} AND voter_id = ${voterId}
    `;
    await this.pg.query(query);
    await this.realtime.publish(`room:board:${boardId}`, 'vote:removed', {
      cardId,
      voterId,
    });
  }

  private mapRowToVote(row: VoteRow): Vote {
    return {
      id: row.id,
      cardId: row.card_id,
      voterId: row.voter_id,
      kind: row.kind,
      createdAt: row.created_at,
    };
  }
}
