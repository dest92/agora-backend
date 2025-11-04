import {
  Controller,
  Get,
  Patch,
  Param,
  Inject,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';

/**
 * Notifications Controller
 * HTTP Gateway → Notifications Service TCP
 */
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly notificationsService: ClientProxy,
  ) {}

  /**
   * GET /notifications
   * List notifications for current user
   */
  @Get()
  async listNotifications(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notificationsService.send(
      { cmd: 'notifications.list' },
      {
        userId: req.user.userId,
        limit: limit || 50,
      },
    );
  }

  /**
   * GET /notifications/unread/count
   * Count unread notifications
   */
  @Get('unread/count')
  async countUnread(@Request() req: any) {
    return this.notificationsService.send(
      { cmd: 'notifications.countUnread' },
      {
        userId: req.user.userId,
      },
    );
  }

  /**
   * PATCH /notifications/:id/read
   * Mark notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @Request() req: any,
  ) {
    return this.notificationsService.send(
      { cmd: 'notifications.markAsRead' },
      {
        notificationId,
        userId: req.user.userId,
      },
    );
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.send(
      { cmd: 'notifications.markAllAsRead' },
      {
        userId: req.user.userId,
      },
    );
  }
}
