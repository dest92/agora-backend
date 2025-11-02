import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { CardRow } from './types/card.types';

describe('BoardsService', () => {
  let service: BoardsService;
  let pgService: jest.Mocked<PgService>;
  let realtimeService: jest.Mocked<RealtimeService>;

  beforeEach(async () => {
    const mockPgService = {
      query: jest.fn(),
    };

    const mockRealtimeService = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: PgService,
          useValue: mockPgService,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    pgService = module.get(PgService);
    realtimeService = module.get(RealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCard', () => {
    it('should create a card and publish realtime event', async () => {
      const input = {
        boardId: '550e8400-e29b-41d4-a716-446655440000',
        authorId: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Test card content',
        laneId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'high' as const,
        position: 100,
      };

      const mockRow: CardRow = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        board_id: input.boardId,
        author_id: input.authorId,
        content: input.content,
        lane_id: input.laneId,
        priority: input.priority,
        position: input.position,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        archived_at: null,
      };

      const mockResult = {
        rows: [mockRow],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      pgService.query.mockResolvedValue(mockResult as any);
      realtimeService.publish.mockResolvedValue(undefined);

      const result = await service.createCard(input);

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${input.boardId}`,
        'card:created',
        expect.objectContaining({
          cardId: mockRow.id,
          boardId: input.boardId,
          content: input.content,
          authorId: input.authorId,
          laneId: input.laneId,
          priority: input.priority,
          position: input.position,
          createdAt: mockRow.created_at.toISOString(),
        }),
      );

      expect(result).toMatchObject({
        id: mockRow.id,
        boardId: input.boardId,
        authorId: input.authorId,
        content: input.content,
        laneId: input.laneId,
        priority: input.priority,
        position: input.position,
      });
    });
  });

  describe('listCards', () => {
    it('should list all cards for a board', async () => {
      const boardId = '550e8400-e29b-41d4-a716-446655440000';
      const mockRows: CardRow[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          board_id: boardId,
          author_id: '550e8400-e29b-41d4-a716-446655440002',
          content: 'Card 1',
          lane_id: null,
          priority: 'normal',
          position: 1000,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          archived_at: null,
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      pgService.query.mockResolvedValue(mockResult as any);

      const result = await service.listCards(boardId);

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockRows[0].id,
        boardId,
        content: 'Card 1',
      });
    });
  });

  describe('updateCard', () => {
    it('should update card and publish event', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440003';
      const boardId = '550e8400-e29b-41d4-a716-446655440000';
      const dto = {
        content: 'Updated content',
        priority: 'high' as const,
      };

      const previousResult = {
        rows: [{ lane_id: null }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      const mockRow: CardRow = {
        id: cardId,
        board_id: boardId,
        author_id: '550e8400-e29b-41d4-a716-446655440001',
        content: dto.content,
        lane_id: null,
        priority: dto.priority,
        position: 1000,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:01:00Z'),
        archived_at: null,
      };

      const mockResult = {
        rows: [mockRow],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      pgService.query
        .mockResolvedValueOnce(previousResult as any)
        .mockResolvedValueOnce(mockResult as any);
      realtimeService.publish.mockResolvedValue(undefined);

      const result = await service.updateCard(cardId, boardId, dto);

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'card:updated',
        expect.objectContaining({
          cardId,
          boardId,
          archived: false,
        }),
      );

      expect(result.content).toBe(dto.content);
      expect(result.priority).toBe(dto.priority);
    });
  });

  describe('archiveCard', () => {
    it('should archive card and publish event', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440003';
      const boardId = '550e8400-e29b-41d4-a716-446655440000';

      const mockRow: CardRow = {
        id: cardId,
        board_id: boardId,
        author_id: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Test card',
        lane_id: null,
        priority: 'normal',
        position: 1000,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        archived_at: new Date('2024-01-01T00:02:00Z'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      pgService.query.mockResolvedValue(mockResult as any);
      realtimeService.publish.mockResolvedValue(undefined);

      const result = await service.archiveCard(cardId, boardId);

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'card:archived',
        expect.objectContaining({
          cardId,
          archived: true,
        }),
      );

      expect(result.archivedAt).toBeTruthy();
    });
  });
});
