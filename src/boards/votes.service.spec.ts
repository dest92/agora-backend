import { Test, TestingModule } from '@nestjs/testing';
import { VotesService, VoteKind } from './votes.service';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';

interface VoteRow {
  id: string;
  card_id: string;
  voter_id: string;
  kind: VoteKind;
  created_at: Date;
}

describe('VotesService', () => {
  let service: VotesService;
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
        VotesService,
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

    service = module.get<VotesService>(VotesService);
    pgService = module.get(PgService);
    realtimeService = module.get(RealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('castVote', () => {
    it('should cast vote up and publish event', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440000';
      const voterId = '550e8400-e29b-41d4-a716-446655440001';
      const boardId = '550e8400-e29b-41d4-a716-446655440002';
      const kind: VoteKind = 'up';

      const mockRow: VoteRow = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        card_id: cardId,
        voter_id: voterId,
        kind,
        created_at: new Date('2024-11-02T18:00:00Z'),
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

      const result = await service.castVote(cardId, voterId, kind, boardId);

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'vote:cast',
        {
          cardId,
          voterId,
          kind,
        },
      );

      expect(result).toMatchObject({
        id: mockRow.id,
        cardId,
        voterId,
        kind,
      });
    });

    it('should toggle vote from up to down', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440000';
      const voterId = '550e8400-e29b-41d4-a716-446655440001';
      const boardId = '550e8400-e29b-41d4-a716-446655440002';
      const kind: VoteKind = 'down';

      const mockRow: VoteRow = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        card_id: cardId,
        voter_id: voterId,
        kind,
        created_at: new Date('2024-11-02T18:00:00Z'),
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

      const result = await service.castVote(cardId, voterId, kind, boardId);

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'vote:cast',
        {
          cardId,
          voterId,
          kind: 'down',
        },
      );

      expect(result.kind).toBe('down');
    });
  });

  describe('removeVote', () => {
    it('should remove vote and publish event', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440000';
      const voterId = '550e8400-e29b-41d4-a716-446655440001';
      const boardId = '550e8400-e29b-41d4-a716-446655440002';

      const mockResult = {
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      };

      pgService.query.mockResolvedValue(mockResult as any);
      realtimeService.publish.mockResolvedValue(undefined);

      await service.removeVote(cardId, voterId, boardId);

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'vote:removed',
        {
          cardId,
          voterId,
        },
      );
    });
  });
});
