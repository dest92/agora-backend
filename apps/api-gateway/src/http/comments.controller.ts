import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  Inject,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCommentDto } from '@app/lib-contracts';

@Controller('boards/:boardId/cards/:cardId/comments')
export class CommentsController {
  constructor(
    @Inject('BOARDS_SERVICE') private readonly boardsService: ClientProxy,
  ) {}

  /**
   * POST /boards/:boardId/cards/:cardId/comments
   * Create a new comment on a card
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: CreateCommentDto,
    @Req() request: any,
  ) {
    return this.boardsService.send('comments.create', {
      cardId,
      boardId,
      authorId: request.user.userId,
      content: dto.content,
    });
  }

  /**
   * GET /boards/:boardId/cards/:cardId/comments
   * List all comments for a card
   */
  @Get()
  async listComments(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('comments.list', {
      cardId,
      boardId,
    });
  }
}
