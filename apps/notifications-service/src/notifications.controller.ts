import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

/**
 * Microservices Pattern: TCP message handlers
 * Cliente-Servidor: Gateway → Notifications TCP
 */

@Controller()
export class NotificationsController {
  /**
   * Hardening: Health Check Handler
   * Microservicios: TCP health.ping response
   */
  @MessagePattern({ cmd: 'health.ping' })
  healthPing(): { ok: boolean } {
    return { ok: true };
  }
}
