import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { ChatMessage } from './types/chat.types';

/**
 * Controller for board chat operations
 */
@Controller('boards/:boardId/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Send a chat message to a board
   * POST /boards/:boardId/chat
   */
  @Post()
  async sendMessage(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendMessage(boardId, userId, dto.content);
  }

  /**
   * List chat messages for a board
   * GET /boards/:boardId/chat?limit=50
   */
  @Get()
  async listMessages(
    @Param('boardId') boardId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ChatMessage[]> {
    return this.chatService.listMessages(boardId, limit);
  }

  /**
   * Delete a chat message
   * DELETE /boards/:boardId/chat/:messageId
   */
  @Delete(':messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ deleted: boolean }> {
    await this.chatService.deleteMessage(messageId, userId);
    return { deleted: true };
  }
}
