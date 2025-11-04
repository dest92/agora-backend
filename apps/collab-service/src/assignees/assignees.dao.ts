import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO Pattern: Usando Supabase REST API
 * Evita problemas de conexión directa a PostgreSQL
 */

interface CardAssigneeRow {
  card_id: string;
  user_id: string;
  assigned_at: string;
}

@Injectable()
export class AssigneesDao {
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
   * Asignar usuario a card con upsert para idempotencia
   */
  async assign(
    cardId: string,
    userId: string,
  ): Promise<CardAssigneeRow | null> {
    const { data, error } = await this.supabase
      .from('card_assignees')
      .upsert(
        {
          card_id: cardId,
          user_id: userId,
          assigned_at: new Date().toISOString(),
        },
        {
          onConflict: 'card_id,user_id',
          ignoreDuplicates: true,
        },
      )
      .select('card_id, user_id, assigned_at')
      .single();

    if (error && error.code !== '23505') {
      // Ignore unique constraint violations
      throw new Error(`Failed to assign user: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Desasignar usuario de card
   */
  async unassign(
    cardId: string,
    userId: string,
  ): Promise<CardAssigneeRow | null> {
    const { data, error } = await this.supabase
      .from('card_assignees')
      .delete()
      .eq('card_id', cardId)
      .eq('user_id', userId)
      .select('card_id, user_id, assigned_at')
      .single();

    if (error) {
      throw new Error(`Failed to unassign user: ${error.message}`);
    }

    return data || null;
  }
}
