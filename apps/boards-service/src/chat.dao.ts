import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export interface ChatMessageRow {
  id: string;
  board_id: string;
  user_id: string;
  content: string;
  created_at: string | Date;
  updated_at: string | Date;
  user_name?: string;
  user_email?: string;
}

@Injectable()
export class ChatDao {
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

  async createMessage(
    boardId: string,
    userId: string,
    content: string,
  ): Promise<ChatMessageRow> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        board_id: boardId,
        user_id: userId,
        content: content,
      })
      .select(
        `
        id, 
        board_id, 
        user_id, 
        content, 
        created_at, 
        updated_at,
        user_name:users!chat_messages_user_id_fkey(display_name),
        user_email:users!chat_messages_user_id_fkey(id)
      `,
      )
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    // Flatten the nested user data
    const flattenedData = {
      ...data,
      user_name: data.user_name?.display_name,
      user_email: data.user_email?.id,
    };

    return flattenedData as ChatMessageRow;
  }

  async listMessages(
    boardId: string,
    limit: number,
  ): Promise<ChatMessageRow[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select(
        `
        id, 
        board_id, 
        user_id, 
        content, 
        created_at, 
        updated_at,
        user_name:users!chat_messages_user_id_fkey(display_name)
      `,
      )
      .eq('board_id', boardId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list messages: ${error.message}`);
    }

    // Flatten the nested user data for each message
    const flattenedData = (data || []).map((msg: any) => ({
      ...msg,
      user_name: msg.user_name?.display_name,
    }));

    return flattenedData as ChatMessageRow[];
  }

  async deleteMessage(messageId: string, userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId)
      .select('board_id')
      .single();

    if (error) {
      return null;
    }

    return data?.board_id || null;
  }
}
