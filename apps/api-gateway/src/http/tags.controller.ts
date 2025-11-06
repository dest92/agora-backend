import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/lib-auth';
import { CreateTagDto } from '@app/lib-contracts';

/**
 * API Gateway Pattern: HTTP → TCP routing
 * Cliente-Servidor: HTTP requests → Collab Service TCP
 * No lógica de negocio: solo validación DTO + proxy
 */

@Controller('boards/:boardId')
@UseGuards(AuthGuard)
export class TagsController {
  constructor(
    @Inject('COLLAB_SERVICE') private readonly collabService: ClientProxy,
  ) {}

  /**
   * POST /boards/:boardId/tags
   * Contract: { label, color? } → Tag
   */
  @Post('tags')
  async createTag(
    @Param('boardId') boardId: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.collabService.send(
      { cmd: 'tags.create' },
      {
        boardId,
        label: createTagDto.label,
        color: createTagDto.color,
      },
    );
  }

  /**
   * GET /boards/:boardId/tags
   * Contract: → Tag[]
   */
  @Get('tags')
  async listTags(@Param('boardId') boardId: string) {
    return this.collabService.send({ cmd: 'tags.list' }, { boardId });
  }

  /**
   * GET /boards/:boardId/cards/:cardId/tags
   * Contract: → Tag[]
   */
  @Get('cards/:cardId/tags')
  async getCardTags(@Param('cardId') cardId: string) {
    return this.collabService.send({ cmd: 'tags.getCardTags' }, { cardId });
  }

  /**
   * POST /boards/:boardId/cards/:cardId/tags/:tagId
   * Contract: → { assigned: boolean }
   */
  @Post('cards/:cardId/tags/:tagId')
  async assignTag(
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.collabService.send(
      { cmd: 'tags.assign' },
      { boardId, cardId, tagId },
    );
  }

  /**
   * DELETE /boards/:boardId/cards/:cardId/tags/:tagId
   * Contract: → { unassigned: boolean }
   */
  @Delete('cards/:cardId/tags/:tagId')
  async unassignTag(
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.collabService.send(
      { cmd: 'tags.unassign' },
      { boardId, cardId, tagId },
    );
  }
}
