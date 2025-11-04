import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';
import { CreateSessionDto } from '@app/lib-contracts';

/**
 * API Gateway Pattern: HTTP → TCP routing
 * Cliente-Servidor: HTTP requests → Sessions Service TCP
 * No lógica de negocio: solo validación params + proxy
 */

@Controller()
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(
    @Inject('SESSIONS_SERVICE') private readonly sessionsService: ClientProxy,
  ) {}

  /**
   * POST /workspaces/:workspaceId/sessions
   * Contract: → Session
   */
  @Post('workspaces/:workspaceId/sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionsService.send(
      { cmd: 'sessions.create' },
      {
        workspaceId,
        title: createSessionDto.title,
      },
    );
  }

  /**
   * POST /sessions/:sessionId/join
   * Contract: → { joined: boolean }
   */
  @Post('sessions/:sessionId/join')
  async joinSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.send(
      { cmd: 'sessions.join' },
      {
        sessionId,
        userId: req.user.userId,
      },
    );
  }

  /**
   * POST /sessions/:sessionId/leave
   * Contract: → { left: boolean }
   */
  @Post('sessions/:sessionId/leave')
  async leaveSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.send(
      { cmd: 'sessions.leave' },
      {
        sessionId,
        userId: req.user.userId,
      },
    );
  }

  /**
   * GET /sessions/:sessionId/presence
   * Contract: → { users: string[] }
   */
  @Get('sessions/:sessionId/presence')
  async getPresence(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessionsService.send(
      { cmd: 'sessions.presence' },
      { sessionId },
    );
  }
}
