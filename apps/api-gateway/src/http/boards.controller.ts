import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateCardDto,
  UpdateCardDto,
  ListCardsQuery,
} from '@app/lib-contracts';

@Controller('boards')
export class BoardsController {
  constructor(
    @Inject('BOARDS_SERVICE') private readonly boardsService: ClientProxy,
  ) {}

  @Post(':boardId/cards')
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.boardsService.send('cards.create', {
      boardId,
      ...dto,
    });
  }

  @Get(':boardId/cards')
  async listCards(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query() query: ListCardsQuery,
  ) {
    return this.boardsService.send('cards.list', {
      boardId,
      laneId: query.laneId,
    });
  }

  @Patch(':boardId/cards/:cardId')
  async updateCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.boardsService.send('cards.update', {
      boardId,
      cardId,
      ...dto,
    });
  }

  @Post(':boardId/cards/:cardId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('cards.archive', {
      boardId,
      cardId,
    });
  }

  @Post(':boardId/cards/:cardId/unarchive')
  @HttpCode(HttpStatus.OK)
  async unarchiveCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('cards.unarchive', {
      boardId,
      cardId,
    });
  }

  @Post(':boardId/projections/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshProjections(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('projections.refresh', { boardId });
  }
}
