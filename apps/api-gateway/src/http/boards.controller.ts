import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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

// Request interface with authenticated user
interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
  };
}

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
  createBoard(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateBoardDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('boards.create', {
      workspaceId,
      title: dto.title,
      createdBy: request.user.userId,
    });
  }

  @Get('workspaces/:workspaceId/boards')
  listBoards(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('boards.list', {
      workspaceId,
      userId: request.user.userId,
    });
  }

  @Get(':boardId')
  getBoard(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('boards.get', { boardId });
  }

  @Get(':boardId/lanes')
  getLanes(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('boards.lanes', { boardId });
  }

  // ===== Card Management =====
  @Post(':boardId/cards')
  @HttpCode(HttpStatus.CREATED)
  createCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCardDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('cards.create', {
      boardId,
      authorId: request.user.userId,
      ...dto,
    });
  }

  @Get(':boardId/cards')
  listCards(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query() query: ListCardsQuery,
  ) {
    return this.boardsService.send('cards.list', {
      boardId,
      laneId: query.laneId,
    });
  }

  @Patch(':boardId/cards/:cardId')
  updateCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: UpdateCardDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('cards.update', {
      boardId,
      cardId,
      userId: request.user.userId,
      ...dto,
    });
  }

  @Post(':boardId/cards/:cardId/archive')
  @HttpCode(HttpStatus.OK)
  archiveCard(
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
  unarchiveCard(
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
  refreshProjections(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardsService.send('projections.refresh', { boardId });
  }

  // ===== Votes Management =====
  @Post(':boardId/cards/:cardId/vote')
  @HttpCode(HttpStatus.OK)
  voteCard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() body: { voteType: 'up' | 'down' },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('votes.vote', {
      boardId,
      cardId,
      voterId: request.user.userId,
      voteType: body.voteType,
    });
  }

  @Delete(':boardId/cards/:cardId/vote')
  @HttpCode(HttpStatus.OK)
  removeVote(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('votes.remove', {
      boardId,
      cardId,
      voterId: request.user.userId,
    });
  }

  @Get(':boardId/cards/:cardId/votes/summary')
  getVoteSummary(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('votes.summary', { cardId });
  }

  @Get(':boardId/cards/:cardId/votes/voters')
  getVoters(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('votes.voters', { cardId });
  }

  @Get(':boardId/cards/:cardId/votes/me')
  getMyVote(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('votes.user', {
      cardId,
      voterId: request.user.userId,
    });
  }

  // ===== Assignees Management =====
  @Post(':boardId/cards/:cardId/assignees/:userId')
  @HttpCode(HttpStatus.OK)
  assignUser(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    console.log('🌐 [API-GATEWAY] POST assignees endpoint called:', {
      boardId,
      cardId,
      userId,
    });
    return this.boardsService.send('assignees.assign', {
      boardId,
      cardId,
      userId,
    });
  }

  @Delete(':boardId/cards/:cardId/assignees/:userId')
  @HttpCode(HttpStatus.OK)
  unassignUser(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.boardsService.send('assignees.remove', {
      boardId,
      cardId,
      userId,
    });
  }

  @Get(':boardId/cards/:cardId/assignees')
  getAssignees(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.boardsService.send('assignees.list', { cardId });
  }

  @Get(':boardId/assignees/me')
  getMyAssignments(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.boardsService.send('assignees.user', {
      userId: request.user.userId,
    });
  }
}
