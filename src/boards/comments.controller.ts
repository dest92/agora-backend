import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthUser } from '../auth/services/jwt-verifier.service';

/**
 * Controller for card comments
 */
@Controller('boards/:boardId/cards/:cardId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.addComment(
      cardId,
      user.userId,
      dto.content,
      boardId,
    );
  }

  @Get()
  async listComments(@Param('cardId', ParseUUIDPipe) cardId: string) {
    return this.commentsService.listComments(cardId);
  }
}
