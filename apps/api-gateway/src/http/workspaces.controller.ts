import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';
import { CreateWorkspaceDto } from '@app/lib-contracts';
import { IsString, IsIn } from 'class-validator';

class AddMemberDto {
  @IsString()
  userId!: string;
}

class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['owner', 'admin', 'member'])
  role!: 'owner' | 'admin' | 'member';
}

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

  /**
   * POST /workspaces/:workspaceId/members
   * Add member to workspace
   */
  @Post(':workspaceId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: AddMemberDto,
    @Request() req: any,
  ) {
    return this.sessionsService.send(
      { cmd: 'workspaces.addMember' },
      {
        workspaceId,
        userId: dto.userId,
        addedBy: req.user.userId,
      },
    );
  }

  /**
   * GET /workspaces/:workspaceId/members
   * List workspace members
   */
  @Get(':workspaceId/members')
  async listMembers(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.sessionsService.send(
      { cmd: 'workspaces.listMembers' },
      { workspaceId },
    );
  }

  /**
   * GET /workspaces/invites
   * List workspaces where user is member (invitations received)
   */
  @Get('invites/list')
  async listInvites(@Request() req: any) {
    return this.sessionsService.send(
      { cmd: 'workspaces.listInvites' },
      { userId: req.user.userId },
    );
  }

  /**
   * GET /workspaces/users/search?q=query
   * Search users by email or name
   */
  @Get('users/search')
  async searchUsers(@Query('q') query: string) {
    return this.sessionsService.send(
      { cmd: 'workspaces.searchUsers' },
      { query },
    );
  }

  /**
   * PATCH /workspaces/:workspaceId/members/:userId/role
   * Update member role (only owners can do this)
   */
  @Patch(':workspaceId/members/:userId/role')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    return this.sessionsService.send(
      { cmd: 'workspaces.updateMemberRole' },
      {
        workspaceId,
        userId,
        role: dto.role,
        requestedBy: req.user.userId,
      },
    );
  }
}
