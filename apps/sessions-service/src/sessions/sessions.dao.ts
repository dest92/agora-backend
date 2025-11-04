import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO Pattern: Usando Supabase REST API
 * Evita problemas de conexión directa a PostgreSQL
 * Microservices: Sessions domain separation
 */

interface SessionRow {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
}

interface SessionParticipantRow {
  session_id: string;
  user_id: string;
  joined_at: string;
}

@Injectable()
export class SessionsDao {
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
          schema: 'sessions',
        },
      },
    );
  }

  /**
   * Crear sesión activa en workspace usando Supabase REST API
   */
  async createSession(workspaceId: string, title: string): Promise<SessionRow> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        workspace_id: workspaceId,
        title: title,
      })
      .select('id, workspace_id, title, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  }

  /**
   * Unirse a sesión (idempotente) usando upsert de Supabase
   */
  async joinSession(
    sessionId: string,
    userId: string,
  ): Promise<SessionParticipantRow | null> {
    const { data, error } = await this.supabase
      .from('session_participants')
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        },
        {
          onConflict: 'session_id,user_id',
          ignoreDuplicates: true,
        },
      )
      .select('session_id, user_id, joined_at')
      .single();

    if (error && error.code !== '23505') {
      // Ignore unique constraint violations
      throw new Error(`Failed to join session: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Salir de sesión usando DELETE de Supabase
   */
  async leaveSession(
    sessionId: string,
    userId: string,
  ): Promise<SessionParticipantRow | null> {
    const { data, error } = await this.supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select('session_id, user_id, joined_at')
      .single();

    if (error) {
      throw new Error(`Failed to leave session: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Obtener participantes de sesión desde Supabase
   */
  async getSessionParticipants(sessionId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get session participants: ${error.message}`);
    }

    return (data || []).map((row: any) => row.user_id);
  }
}
