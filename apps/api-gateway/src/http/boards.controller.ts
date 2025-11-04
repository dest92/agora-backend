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
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateCardDto, ListCardsQuery } from '@app/lib-contracts';
import { IsString, IsOptional, IsNumber } from 'class-validator';

// Temporary inline DTO until lib-contracts is properly structured
class CreateCardDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  laneId?: string;
}

class CreateBoardDto {
  @IsString()
  title!: string;
}

@Controller('boards')
export class BoardsController {
  constructor(
    @Inject('BOARDS_SERVICE') private readonly boardsService: ClientProxy,
  ) {}

  // ===== Board Management =====
  @Post('workspaces/:workspaceId/boards')
  @HttpCode(HttpStatus.CREATED)
  async createBoard(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateBoardDto,
    @Req() request: any,
  ) {
    return this.boardsService.send('boards.create', {
      workspaceId,
      title: dto.title,
      createdBy: request.user.userId,
    });
  }

  @Get('workspaces/:workspaceId/boards')
  async listBoards(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Req() request: any,
  ) {
    return this.boardsService.send('boards.list', {
      workspaceId,
      userId: request.user.userId,
    });
  }

  @Get(':boardId')
  async getBoard(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('boards.get', { boardId });
  }

  @Get(':boardId/lanes')
  async getLanes(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('boards.lanes', { boardId });
  }

  // ===== Card Management =====
  @Post(':boardId/cards')
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCardDto,
    @Req() request: any,
  ) {
    return this.boardsService.send('cards.create', {
      boardId,
      authorId: request.user.userId,
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
