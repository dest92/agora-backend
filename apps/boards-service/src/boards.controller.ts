import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BoardsCommandService } from './boards.command.service';
import { BoardsQueryService } from './boards.query.service';

@Controller()
export class BoardsController {
  constructor(
    private readonly commandService: BoardsCommandService,
    private readonly queryService: BoardsQueryService,
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
      content?: string;
      laneId?: string;
      priority?: string;
      position?: number;
    },
  ) {
    const { cardId, boardId, ...updates } = data;
    return this.commandService.updateCard(cardId, boardId, updates);
  }

  @MessagePattern('cards.archive')
  async archiveCard(@Payload() data: { cardId: string; boardId: string }) {
    return this.commandService.archiveCard(data.cardId, data.boardId);
  }

  @MessagePattern('cards.unarchive')
  async unarchiveCard(@Payload() data: { cardId: string; boardId: string }) {
    return this.commandService.unarchiveCard(data.cardId, data.boardId);
  }

  @MessagePattern('projections.refresh')
  async refreshProjections(@Payload() data: { boardId: string }) {
    return this.commandService.refreshProjections();
  }
}
