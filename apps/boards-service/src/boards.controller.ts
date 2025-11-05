import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BoardsCommandService } from './boards.command.service';
import { BoardsQueryService } from './boards.query.service';
import { BoardsManagementCommandService } from './boards-management.command.service';
import { BoardsManagementQueryService } from './boards-management.query.service';
import { VotesCommandService } from './votes.command.service';
import { VotesQueryService } from './votes.query.service';
import { AssigneesCommandService } from './assignees.command.service';
import { AssigneesQueryService } from './assignees.query.service';

@Controller()
export class BoardsController {
  constructor(
    private readonly commandService: BoardsCommandService,
    private readonly queryService: BoardsQueryService,
    private readonly boardsManagementCommandService: BoardsManagementCommandService,
    private readonly boardsManagementQueryService: BoardsManagementQueryService,
    private readonly votesCommandService: VotesCommandService,
    private readonly votesQueryService: VotesQueryService,
    private readonly assigneesCommandService: AssigneesCommandService,
    private readonly assigneesQueryService: AssigneesQueryService,
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

  @MessagePattern('boards.lanes.create')
  async createLane(@Payload() data: { boardId: string; name: string }) {
    return this.boardsManagementCommandService.createLane(data);
  }

  @MessagePattern('boards.lanes.updatePosition')
  async updateLanePosition(
    @Payload() data: { laneId: string; position: number },
  ) {
    return this.boardsManagementCommandService.updateLanePosition(data);
  }

  @MessagePattern('boards.lanes.delete')
  async deleteLane(@Payload() data: { laneId: string }) {
    return this.boardsManagementCommandService.deleteLane(data);
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

  // ===== Assignees Endpoints =====

  @MessagePattern('assignees.assign')
  async assignUser(
    @Payload()
    data: {
      cardId: string;
      userId: string;
      boardId: string;
    },
  ) {
    console.log(
      '📨 [BOARDS-CONTROLLER] Received assignees.assign message:',
      data,
    );
    const result = await this.assigneesCommandService.assignUser(
      data.cardId,
      data.userId,
      data.boardId,
    );
    console.log('📤 [BOARDS-CONTROLLER] Assign result:', result);
    return result;
  }

  @MessagePattern('assignees.remove')
  async unassignUser(
    @Payload()
    data: {
      cardId: string;
      userId: string;
      boardId: string;
    },
  ) {
    return this.assigneesCommandService.unassignUser(
      data.cardId,
      data.userId,
      data.boardId,
    );
  }

  @MessagePattern('assignees.list')
  async getAssignees(@Payload() data: { cardId: string }) {
    console.log('📋 [BOARDS] Getting assignees for card:', data.cardId);
    const assignees = await this.assigneesQueryService.getAssignees(
      data.cardId,
    );
    console.log('📥 [BOARDS] Assignees found:', assignees);
    return assignees;
  }

  @MessagePattern('assignees.user')
  async getUserAssignments(@Payload() data: { userId: string }) {
    return this.assigneesQueryService.getUserAssignments(data.userId);
  }
}
