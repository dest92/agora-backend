import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';
import { CreateWorkspaceDto } from '@app/lib-contracts';

/**
 * API Gateway Pattern: HTTP → TCP routing
 * Cliente-Servidor: HTTP requests → Sessions Service TCP
 * No lógica de negocio: solo validación DTOs + proxy
 */

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  constructor(
    @Inject('SESSIONS_SERVICE') private readonly sessionsService: ClientProxy,
  ) {}

  /**
   * POST /workspaces
   * Contract: → Workspace
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Request() req: any,
  ) {
    return this.sessionsService.send(
      { cmd: 'workspaces.create' },
      {
        ownerId: req.user.userId,
        name: createWorkspaceDto.name,
      },
    );
  }

  /**
   * GET /workspaces
   * Contract: → Workspace[]
   */
  @Get()
  async listWorkspaces(@Request() req: any) {
    return this.sessionsService.send(
      { cmd: 'workspaces.list' },
      { userId: req.user.userId },
    );
  }
}
