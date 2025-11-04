import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BoardsCommandService } from './boards.command.service';
import { BoardsQueryService } from './boards.query.service';
import { BoardsManagementCommandService } from './boards-management.command.service';
import { BoardsManagementQueryService } from './boards-management.query.service';
import { VotesCommandService } from './votes.command.service';
import { VotesQueryService } from './votes.query.service';

@Controller()
export class BoardsController {
  constructor(
    private readonly commandService: BoardsCommandService,
    private readonly queryService: BoardsQueryService,
    private readonly boardsManagementCommandService: BoardsManagementCommandService,
    private readonly boardsManagementQueryService: BoardsManagementQueryService,
    private readonly votesCommandService: VotesCommandService,
    private readonly votesQueryService: VotesQueryService,
  ) {}

  @MessagePattern('cards.create')
  async createCard(
    @Payload()
    data: {
      boardId: string;
      authorId: string;
      content: string;
      priority: string;
      position: number;
      laneId?: string; // Optional
    },
  ) {
    return this.commandService.createCard(data);
  }

  @MessagePattern('cards.list')
  async listCards(@Payload() data: { boardId: string; laneId?: string }) {
    return this.queryService.listCards(data.boardId, data.laneId);
  }

  @MessagePattern('cards.update')
  async updateCard(
    @Payload()
    data: {
      cardId: string;
      boardId: string;
      userId?: string;
      content?: string;
      laneId?: string;
      priority?: string;
      position?: number;
    },
  ) {
    const { cardId, boardId, userId, ...updates } = data;
    return this.commandService.updateCard(cardId, boardId, updates, userId);
  }

  @MessagePattern('cards.archive')
  async archiveCard(@Payload() data: { cardId: string; boardId: string }) {
    return this.commandService.archiveCard(data.cardId, data.boardId);
  }

  @MessagePattern('cards.unarchive')
  async unarchiveCard(@Payload() data: { cardId: string; boardId: string }) {
    return this.commandService.unarchiveCard(data.cardId, data.boardId);
  }

  @MessagePattern('comments.create')
  async createComment(
    @Payload()
    data: {
      cardId: string;
      boardId: string;
      authorId: string;
      content: string;
    },
  ) {
    return this.commandService.createComment(data);
  }

  @MessagePattern('comments.list')
  async listComments(@Payload() data: { cardId: string; boardId: string }) {
    return this.queryService.listComments(data.cardId);
  }

  @MessagePattern({ cmd: 'boards.refresh_projections' })
  async refreshProjections(): Promise<{ refreshed: boolean }> {
    await this.commandService.refreshProjections();
    return { refreshed: true };
  }

  /**
   * Hardening: Health Check Handler
   * Microservicios: TCP health.ping response
   */
  @MessagePattern({ cmd: 'health.ping' })
  healthPing(): { ok: boolean } {
    return { ok: true };
  }

  // ===== Board Management Endpoints =====

  @MessagePattern('boards.create')
  async createBoard(
    @Payload()
    data: {
      workspaceId: string;
      title: string;
      createdBy: string;
    },
  ) {
    return this.boardsManagementCommandService.createBoard(data);
  }

  @MessagePattern('boards.list')
  async listBoards(@Payload() data: { workspaceId: string; userId?: string }) {
    return this.boardsManagementQueryService.listBoards(
      data.workspaceId,
      data.userId,
    );
  }

  @MessagePattern('boards.get')
  async getBoard(@Payload() data: { boardId: string }) {
    return this.boardsManagementQueryService.getBoard(data.boardId);
  }

  @MessagePattern('boards.lanes')
  async getLanes(@Payload() data: { boardId: string }) {
    return this.boardsManagementQueryService.getLanes(data.boardId);
  }

  // ===== Votes Endpoints =====

  @MessagePattern('votes.vote')
  async voteCard(
    @Payload()
    data: {
      cardId: string;
      boardId: string;
      voterId: string;
      voteType: 'up' | 'down';
    },
  ) {
    return this.votesCommandService.voteCard(
      data.cardId,
      data.boardId,
      data.voterId,
      data.voteType,
    );
  }

  @MessagePattern('votes.remove')
  async removeVote(
    @Payload()
    data: {
      cardId: string;
      boardId: string;
      voterId: string;
    },
  ) {
    return this.votesCommandService.removeVote(
      data.cardId,
      data.boardId,
      data.voterId,
    );
  }

  @MessagePattern('votes.summary')
  async getVoteSummary(@Payload() data: { cardId: string }) {
    return this.votesQueryService.getVoteSummary(data.cardId);
  }

  @MessagePattern('votes.voters')
  async getVoters(@Payload() data: { cardId: string }) {
    return this.votesQueryService.getVoters(data.cardId);
  }

  @MessagePattern('votes.user')
  async getUserVote(@Payload() data: { cardId: string; voterId: string }) {
    return this.votesQueryService.getUserVote(data.cardId, data.voterId);
  }
}
