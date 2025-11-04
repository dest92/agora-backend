import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface CardRow {
  id: string;
  board_id: string;
  author_id: string;
  content: string;
  lane_id: string | null;
  priority: string;
  position: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

interface CommentRow {
  id: string;
  card_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}

@Injectable()
export class BoardsDao {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  async createCard(input: {
    boardId: string;
    authorId: string;
    content: string;
    priority: string;
    position: number;
    laneId?: string;
  }): Promise<CardRow> {
    const { data, error } = await this.supabase
      .from('cards')
      .insert({
        board_id: input.boardId,
        author_id: input.authorId,
        content: input.content,
        priority: input.priority,
        position: input.position,
        lane_id: input.laneId || null,
      })
      .select(
        'id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at',
      )
      .single();

    if (error) {
      throw new Error(`Failed to create card: ${error.message}`);
    }

    return data;
  }

  async listCards(boardId: string, laneId?: string): Promise<CardRow[]> {
    let query = this.supabase
      .from('cards')
      .select(
        'id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at',
      )
      .eq('board_id', boardId)
      .is('archived_at', null)
      .order('position', { ascending: true });

    if (laneId) {
      query = query.eq('lane_id', laneId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list cards: ${error.message}`);
    }

    return data || [];
  }

  async updateCard(
    cardId: string,
    boardId: string,
    updates: {
      content?: string;
      laneId?: string;
      priority?: string;
      position?: number;
    },
  ): Promise<{ previousLaneId: string | null; card: CardRow }> {
    // Get previous lane_id
    const { data: previousData } = await this.supabase
      .from('cards')
      .select('lane_id')
      .eq('id', cardId)
      .eq('board_id', boardId)
      .single();

    const previousLaneId = previousData?.lane_id || null;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.laneId !== undefined) updateData.lane_id = updates.laneId;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.position !== undefined) updateData.position = updates.position;

    const { data, error } = await this.supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .eq('board_id', boardId)
      .select(
        'id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at',
      )
      .single();

    if (error) {
      throw new Error(`Failed to update card: ${error.message}`);
    }

    return { previousLaneId, card: data };
  }

  async archiveCard(cardId: string, boardId: string): Promise<CardRow> {
    const { data, error } = await this.supabase
      .from('cards')
      .update({
        archived_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('board_id', boardId)
      .is('archived_at', null)
      .select(
        'id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at',
      )
      .single();

    if (error) {
      throw new Error(`Failed to archive card: ${error.message}`);
    }

    return data;
  }

  async unarchiveCard(cardId: string, boardId: string): Promise<CardRow> {
    const { data, error } = await this.supabase
      .from('cards')
      .update({
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('board_id', boardId)
      .not('archived_at', 'is', null)
      .select(
        'id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at',
      )
      .single();

    if (error) {
      throw new Error(`Failed to unarchive card: ${error.message}`);
    }

    return data;
  }

  async refreshProjections(): Promise<void> {
    // Supabase doesn't support stored procedures via REST API easily
    // This would need to be called via RPC
    try {
      await this.supabase.rpc('refresh_mv_board_lane_counts');
    } catch {
      // Ignore if function doesn't exist
    }
    try {
      await this.supabase.rpc('refresh_mv_card_counters');
    } catch {
      // Ignore if function doesn't exist
    }
  }

  // ===== Comments =====

  async createComment(input: {
    cardId: string;
    authorId: string;
    content: string;
  }): Promise<CommentRow> {
    const { data, error } = await this.supabase
      .from('comments')
      .insert({
        card_id: input.cardId,
        author_id: input.authorId,
        content: input.content,
      })
      .select('id, card_id, author_id, content, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    return data;
  }

  async listComments(cardId: string): Promise<CommentRow[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select('id, card_id, author_id, content, created_at')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to list comments: ${error.message}`);
    }

    return data || [];
  }
}
