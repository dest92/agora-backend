/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export interface AssigneeRow {
  card_id: string;
  user_id: string;
  assigned_at: string;
}

@Injectable()
export class AssigneesDao {
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
   * Assign a user to a card
   */
  async assignUser(cardId: string, userId: string): Promise<AssigneeRow> {
    const { data, error } = await this.supabase
      .from('card_assignees')
      .insert({
        card_id: cardId,
        user_id: userId,
      })
      .select('card_id, user_id, assigned_at')
      .single();

    if (error) {
      throw new Error(`Failed to assign user: ${error.message}`);
    }

    return data as AssigneeRow;
  }

  /**
   * Unassign a user from a card
   */
  async unassignUser(cardId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('card_assignees')
      .delete()
      .eq('card_id', cardId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unassign user: ${error.message}`);
    }
  }

  /**
   * Get all assignees for a card
   */
  async getAssignees(cardId: string): Promise<AssigneeRow[]> {
    console.log('🔍 [DAO] Fetching assignees from DB for card:', cardId);
    const { data, error } = await this.supabase
      .from('card_assignees')
      .select('card_id, user_id, assigned_at')
      .eq('card_id', cardId);

    if (error) {
      console.error('❌ [DAO] Error fetching assignees:', error);
      throw new Error(`Failed to get assignees: ${error.message}`);
    }

    console.log('✅ [DAO] Raw data from DB:', data);
    return (data as AssigneeRow[]) || [];
  }

  /**
   * Get all cards assigned to a user
   */
  async getUserAssignments(userId: string): Promise<AssigneeRow[]> {
    const { data, error } = await this.supabase
      .from('card_assignees')
      .select('card_id, user_id, assigned_at')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get user assignments: ${error.message}`);
    }

    return (data as AssigneeRow[]) || [];
  }

  /**
   * Check if a user is assigned to a card
   */
  async isUserAssigned(cardId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('card_assignees')
      .select('card_id')
      .eq('card_id', cardId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Failed to check assignment: ${error.message}`);
    }

    return !!data;
  }
}
