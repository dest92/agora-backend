import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  Inject,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

interface CreateChatMessageDto {
  content: string;
}

@Controller('boards/:boardId/chat')
export class ChatController {
  constructor(
    @Inject('BOARDS_SERVICE') private readonly boardsService: ClientProxy,
  ) {}

  /**
   * POST /boards/:boardId/chat
   * Send a chat message to a board
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateChatMessageDto,
    @Req() request: any,
  ) {
    return this.boardsService.send('chat.sendMessage', {
      boardId,
      userId: request.user.userId,
      content: dto.content,
    });
  }

  /**
   * GET /boards/:boardId/chat?limit=50
   * List chat messages for a board
   */
  @Get()
  async listMessages(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.boardsService.send('chat.listMessages', {
      boardId,
      limit: limit || 50,
    });
  }

  /**
   * DELETE /boards/:boardId/chat/:messageId
   * Delete a chat message
   */
  @Delete(':messageId')
  async deleteMessage(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Req() request: any,
  ) {
    return this.boardsService.send('chat.deleteMessage', {
      messageId,
      userId: request.user.userId,
    });
  }
}
