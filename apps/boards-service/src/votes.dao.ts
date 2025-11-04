/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface VoteRow {
  id: string;
  card_id: string;
  voter_id: string;
  weight: number;
  created_at: string;
}

@Injectable()
export class VotesDao {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'boards',
        },
      },
    );
  }

  /**
   * Add or update a vote (upsert)
   * weight: 1 for upvote, -1 for downvote
   */
  async upsertVote(
    cardId: string,
    voterId: string,
    weight: number,
  ): Promise<VoteRow> {
    const { data, error } = await this.supabase
      .from('votes')
      .upsert(
        {
          card_id: cardId,
          voter_id: voterId,
          weight: weight,
        },
        {
          onConflict: 'card_id,voter_id',
        },
      )
      .select('id, card_id, voter_id, weight, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to upsert vote: ${error.message}`);
    }

    return data as VoteRow;
  }

  /**
   * Remove a vote
   */
  async removeVote(cardId: string, voterId: string): Promise<void> {
    const { error } = await this.supabase
      .from('votes')
      .delete()
      .eq('card_id', cardId)
      .eq('voter_id', voterId);

    if (error) {
      throw new Error(`Failed to remove vote: ${error.message}`);
    }
  }

  /**
   * Get all votes for a card
   */
  async getVotesByCard(cardId: string): Promise<VoteRow[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('id, card_id, voter_id, weight, created_at')
      .eq('card_id', cardId);

    if (error) {
      throw new Error(`Failed to get votes: ${error.message}`);
    }

    return (data as VoteRow[]) || [];
  }

  /**
   * Get vote summary for a card
   */
  async getVoteSummary(cardId: string): Promise<{
    upvotes: number;
    downvotes: number;
    total: number;
  }> {
    const votes = await this.getVotesByCard(cardId);

    const upvotes = votes.filter((v) => v.weight > 0).length;
    const downvotes = votes.filter((v) => v.weight < 0).length;
    const total = votes.reduce((sum, v) => sum + v.weight, 0);

    return { upvotes, downvotes, total };
  }

  /**
   * Get user's vote for a card (if exists)
   */
  async getUserVote(cardId: string, voterId: string): Promise<VoteRow | null> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('id, card_id, voter_id, weight, created_at')
      .eq('card_id', cardId)
      .eq('voter_id', voterId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Failed to get user vote: ${error.message}`);
    }

    return (data as VoteRow) || null;
  }

  /**
   * Get all voters for a card (with their vote weight)
   */
  async getVoters(cardId: string): Promise<
    Array<{
      voterId: string;
      weight: number;
    }>
  > {
    const votes = await this.getVotesByCard(cardId);
    return votes.map((v) => ({
      voterId: v.voter_id,
      weight: v.weight,
    }));
  }
}
