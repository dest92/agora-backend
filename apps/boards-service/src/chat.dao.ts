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
  private supabaseUsers;

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

    // Cliente separado para acceder al schema users
    this.supabaseUsers = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'users',
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
        updated_at
      `,
      )
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    // Fetch user info separately from users.profiles
    const { data: userData } = await this.supabaseUsers
      .from('profiles')
      .select('display_name, user_id')
      .eq('user_id', userId)
      .single();

    // Flatten the data
    const flattenedData = {
      ...data,
      user_name: userData?.display_name || null,
      user_email: userId,
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
        updated_at
      `,
      )
      .eq('board_id', boardId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list messages: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch all unique user IDs
    const userIds = [...new Set(data.map((msg: any) => msg.user_id))];

    // Fetch user profiles for all users
    const { data: usersData, error: usersError } = await this.supabaseUsers
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching user profiles:', usersError);
    }

    // Create a map for quick lookup
    const usersMap = new Map();
    (usersData || []).forEach((user: any) => {
      usersMap.set(user.user_id, user.display_name);
    });

    // Flatten the data
    const flattenedData = data.map((msg: any) => ({
      ...msg,
      user_name: usersMap.get(msg.user_id) || null,
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
