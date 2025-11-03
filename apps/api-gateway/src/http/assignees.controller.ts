import {
  Controller,
  Post,
  Delete,
  Param,
  Inject,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';

/**
 * API Gateway Pattern: HTTP → TCP routing
 * Cliente-Servidor: HTTP requests → Collab Service TCP
 * No lógica de negocio: solo validación params + proxy
 */

@Controller('boards/:boardId/cards/:cardId')
@UseGuards(AuthGuard)
export class AssigneesController {
  constructor(
    @Inject('COLLAB_SERVICE') private readonly collabService: ClientProxy,
  ) {}

  /**
   * POST /boards/:boardId/cards/:cardId/assignees/:userId
   * Contract: → { assigned: boolean }
   */
  @Post('assignees/:userId')
  async addAssignee(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.collabService.send(
      { cmd: 'assignees.add' },
      { boardId, cardId, userId },
    );
  }

  /**
   * DELETE /boards/:boardId/cards/:cardId/assignees/:userId
   * Contract: → { removed: boolean }
   */
  @Delete('assignees/:userId')
  async removeAssignee(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.collabService.send(
      { cmd: 'assignees.remove' },
      { boardId, cardId, userId },
    );
  }
}
