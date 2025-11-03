import {
  Controller,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthUser } from '../auth/services/jwt-verifier.service';

/**
 * Controller for card votes
 */
@Controller('boards/:boardId/cards/:cardId/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('up')
  @HttpCode(HttpStatus.CREATED)
  async voteUp(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.votesService.castVote(cardId, user.userId, 'up', boardId);
  }

  @Post('down')
  @HttpCode(HttpStatus.CREATED)
  async voteDown(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.votesService.castVote(cardId, user.userId, 'down', boardId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeVote(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.votesService.removeVote(cardId, user.userId, boardId);
  }
}
