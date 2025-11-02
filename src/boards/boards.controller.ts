import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  Get,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ListCardsQuery } from './dto/list-cards.query';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthUser } from '../auth/services/jwt-verifier.service';
import type { Card } from './types/card.types';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post(':boardId/cards')
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCardDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Card> {
    return this.boardsService.createCard({
      boardId,
      authorId: user.userId,
      ...dto,
    });
  }

  @Get(':boardId/cards')
  async listCards(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query() query: ListCardsQuery,
  ): Promise<Card[]> {
    return this.boardsService.listCards(boardId, query.laneId);
  }

  @Patch(':boardId/cards/:cardId')
  async updateCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: UpdateCardDto,
  ): Promise<Card> {
    if (
      !dto.content &&
      !dto.laneId &&
      !dto.priority &&
      dto.position === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }
    return this.boardsService.updateCard(cardId, boardId, dto);
  }

  @Post(':boardId/cards/:cardId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<Card> {
    return this.boardsService.archiveCard(cardId, boardId);
  }

  @Post(':boardId/cards/:cardId/unarchive')
  @HttpCode(HttpStatus.OK)
  async unarchiveCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<Card> {
    return this.boardsService.unarchiveCard(cardId, boardId);
  }

  @Post(':boardId/projections/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshProjections(): Promise<{ refreshed: boolean }> {
    return this.boardsService.refreshProjections();
  }
}
