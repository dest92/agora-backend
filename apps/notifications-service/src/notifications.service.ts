import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  body: string;
}

/**
 * Notifications Service
 * Handles notification creation and retrieval
 */
@Injectable()
export class NotificationsService {
  private supabase: any; // Use any to avoid schema typing issues

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
          schema: 'notifications',
        },
      },
    );
  }

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    console.log('📬 Creating notification:', dto);

    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
      })
      .select('id, user_id, type, title, body, read_at, created_at')
      .single();

    if (error) {
      console.error('❌ Failed to create notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    console.log('✅ Notification created:', data.id);

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      body: data.body,
      readAt: data.read_at,
      createdAt: data.created_at,
    };
  }

  /**
   * List notifications for a user
   */
  async listNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    console.log('📋 Listing notifications for user:', userId);

    const { data, error } = await this.supabase
      .from('notifications')
      .select('id, user_id, type, title, body, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to list notifications:', error);
      throw new Error(`Failed to list notifications: ${error.message}`);
    }

    console.log(`✅ Found ${data.length} notifications`);

    return data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('❌ Failed to count unread notifications:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    console.log('✓ Marking notification as read:', notificationId);

    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    console.log('✅ Notification marked as read');
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    console.log('✓✓ Marking all notifications as read for user:', userId);

    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }

    console.log('✅ All notifications marked as read');
  }
}
