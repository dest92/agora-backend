import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

/**
 * Microservices Pattern: TCP message handlers
 * Cliente-Servidor: Gateway → Notifications TCP
 */

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Hardening: Health Check Handler
   * Microservicios: TCP health.ping response
   */
  @MessagePattern({ cmd: 'health.ping' })
  healthPing(): { ok: boolean } {
    return { ok: true };
  }

  /**
   * Create a notification
   */
  @MessagePattern({ cmd: 'notifications.create' })
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
  }) {
    return this.notificationsService.createNotification(data);
  }

  /**
   * List notifications for a user
   */
  @MessagePattern({ cmd: 'notifications.list' })
  async listNotifications(data: { userId: string; limit?: number }) {
    return this.notificationsService.listNotifications(data.userId, data.limit);
  }

  /**
   * Count unread notifications
   */
  @MessagePattern({ cmd: 'notifications.countUnread' })
  async countUnread(data: { userId: string }) {
    return this.notificationsService.countUnread(data.userId);
  }

  /**
   * Mark notification as read
   */
  @MessagePattern({ cmd: 'notifications.markAsRead' })
  async markAsRead(data: { notificationId: string; userId: string }) {
    await this.notificationsService.markAsRead(
      data.notificationId,
      data.userId,
    );
    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  @MessagePattern({ cmd: 'notifications.markAllAsRead' })
  async markAllAsRead(data: { userId: string }) {
    await this.notificationsService.markAllAsRead(data.userId);
    return { success: true };
  }
}
