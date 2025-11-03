import { Controller, Get, Inject, Logger, HttpStatus, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import type { Response } from 'express';
import { Public } from '@app/lib-auth';
import type { EventBus } from '@app/lib-events';

/**
 * API Gateway Pattern: Health matrix endpoint
 * Microservicios: TCP health.ping a todos los services
 * Cliente-Servidor: Gateway → Services TCP
 */

interface ServiceHealthStatus {
  readonly service: string;
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly reason?: string;
}

interface HealthMatrix {
  readonly services: readonly ServiceHealthStatus[];
  readonly overall: boolean;
  readonly timestamp: string;
}

@Controller('_services')
export class ServicesHealthController {
  private readonly logger = new Logger(ServicesHealthController.name);

  constructor(
    @Inject('BOARDS_SERVICE') private readonly boardsService: ClientProxy,
    @Inject('COLLAB_SERVICE') private readonly collabService: ClientProxy,
    @Inject('SESSIONS_SERVICE') private readonly sessionsService: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsService: ClientProxy,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  /**
   * GET /_services/health
   * Microservicios: Consultar health de todos los services por TCP
   * Cliente-Servidor: Gateway → Services TCP health.ping
   */
  @Get('health')
  @Public()
  async getServicesHealth(@Res() res: Response): Promise<void> {
    const services = [
      { name: 'boards', client: this.boardsService },
      { name: 'collab', client: this.collabService },
      { name: 'sessions', client: this.sessionsService },
      { name: 'notifications', client: this.notificationsService },
    ];

    // Check all services including Redis
    const healthChecks = [
      ...services.map((service) =>
        this.checkServiceHealth(service.name, service.client),
      ),
      this.checkRedisHealth(),
    ];
    
    const results = await Promise.all(healthChecks);
    const overall = results.every((result) => result.ok);

    // Log latencies for monitoring
    results.forEach((result) => {
      this.logger.log(
        `Health check: ${result.service} - ${result.ok ? 'OK' : 'FAIL'} (${result.latencyMs}ms)`,
      );
    });

    const healthMatrix: HealthMatrix = {
      services: results,
      overall,
      timestamp: new Date().toISOString(),
    };

    // Return 200 if all ok, 503 if any service fails (but always return the matrix)
    const statusCode = overall ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(healthMatrix);
  }

  /**
   * Microservicios Pattern: TCP health.ping message
   * Validar shape exacto { ok: true }
   */
  private async checkServiceHealth(
    serviceName: string,
    client: ClientProxy,
  ): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        client.send({ cmd: 'health.ping' }, {}).pipe(
          timeout(5000),
          catchError((error) => of({ error: error.message })),
        ),
      );

      const latencyMs = Date.now() - startTime;

      // Validar shape exacto { ok: true }
      if (response && typeof response === 'object' && response.ok === true) {
        return {
          service: serviceName,
          ok: true,
          latencyMs,
        };
      }

      // Si hay error en response
      if (response?.error) {
        return {
          service: serviceName,
          ok: false,
          latencyMs,
          reason: response.error,
        };
      }

      // Shape inválido
      return {
        service: serviceName,
        ok: false,
        latencyMs,
        reason: 'Invalid response format',
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        service: serviceName,
        ok: false,
        latencyMs,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * EDA Pattern: Redis EventBus health check
   * Non-destructive ping to verify Redis connection
   */
  private async checkRedisHealth(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.eventBus.ping();
      const latencyMs = Date.now() - startTime;

      return {
        service: 'redis',
        ok: isHealthy,
        latencyMs,
        reason: isHealthy ? undefined : 'Redis ping failed',
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        service: 'redis',
        ok: false,
        latencyMs,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
