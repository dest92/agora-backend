import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO Pattern: Usando Supabase REST API
 * Evita problemas de conexión directa a PostgreSQL
 */

interface TagRow {
  id: string;
  board_id: string;
  label: string;
  color: string | null;
}

interface CardTagRow {
  card_id: string;
  tag_id: string;
}

@Injectable()
export class TagsDao {
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

  /**
   * Crear tag con upsert para unicidad por (board_id, label)
   */
  async tagsCreate(
    boardId: string,
    label: string,
    color?: string,
  ): Promise<TagRow> {
    const { data, error } = await this.supabase
      .from('tags')
      .upsert(
        {
          board_id: boardId,
          label: label,
          color: color || null,
        },
        {
          onConflict: 'board_id,label',
        },
      )
      .select('id, board_id, label, color')
      .single();

    if (error) {
      throw new Error(`Failed to create tag: ${error.message}`);
    }

    return data;
  }

  /**
   * Listar tags del board ordenados alfabéticamente
   */
  async tagsList(boardId: string): Promise<TagRow[]> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('id, board_id, label, color')
      .eq('board_id', boardId)
      .order('label', { ascending: true });

    if (error) {
      throw new Error(`Failed to list tags: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Asignar tag a card con upsert para idempotencia
   */
  async tagAssign(cardId: string, tagId: string): Promise<CardTagRow | null> {
    const { data, error } = await this.supabase
      .from('card_tags')
      .upsert(
        {
          card_id: cardId,
          tag_id: tagId,
        },
        {
          onConflict: 'card_id,tag_id',
          ignoreDuplicates: true,
        },
      )
      .select('card_id, tag_id')
      .single();

    if (error && error.code !== '23505') {
      // Ignore unique constraint violations
      throw new Error(`Failed to assign tag: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Desasignar tag de card
   */
  async tagUnassign(cardId: string, tagId: string): Promise<void> {
    const { error } = await this.supabase
      .from('card_tags')
      .delete()
      .eq('card_id', cardId)
      .eq('tag_id', tagId);

    if (error) {
      throw new Error(`Failed to unassign tag: ${error.message}`);
    }
  }

  /**
   * Obtener tags de una card específica
   */
  async getCardTags(cardId: string): Promise<TagRow[]> {
    const { data, error } = await this.supabase
      .from('card_tags')
      .select('tag_id, tags(id, board_id, label, color)')
      .eq('card_id', cardId);

    if (error) {
      throw new Error(`Failed to get card tags: ${error.message}`);
    }

    // Transform nested structure to flat TagRow array
    return (data || []).map((item: any) => ({
      id: item.tags.id,
      board_id: item.tags.board_id,
      label: item.tags.label,
      color: item.tags.color,
    }));
  }
}
