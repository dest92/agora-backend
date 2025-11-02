import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService, Comment } from './comments.service';
import { PgService } from '../shared/database/pg.service';
import { RealtimeService } from '../realtime/realtime.service';

interface CommentRow {
  id: string;
  card_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}

describe('CommentsService', () => {
  let service: CommentsService;
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
        CommentsService,
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

    service = module.get<CommentsService>(CommentsService);
    pgService = module.get(PgService);
    realtimeService = module.get(RealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addComment', () => {
    it('should add comment and publish event', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440000';
      const authorId = '550e8400-e29b-41d4-a716-446655440001';
      const boardId = '550e8400-e29b-41d4-a716-446655440002';
      const content = 'Great work on this task!';

      const mockRow: CommentRow = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        card_id: cardId,
        author_id: authorId,
        content,
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

      const result = await service.addComment(
        cardId,
        authorId,
        content,
        boardId,
      );

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(realtimeService.publish).toHaveBeenCalledWith(
        `room:board:${boardId}`,
        'comment:added',
        expect.objectContaining({
          commentId: mockRow.id,
          cardId,
          authorId,
          content,
          createdAt: mockRow.created_at.toISOString(),
        }),
      );

      expect(result).toMatchObject({
        id: mockRow.id,
        cardId,
        authorId,
        content,
      });
    });
  });

  describe('listComments', () => {
    it('should list comments for a card', async () => {
      const cardId = '550e8400-e29b-41d4-a716-446655440000';

      const mockRows: CommentRow[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          card_id: cardId,
          author_id: '550e8400-e29b-41d4-a716-446655440002',
          content: 'First comment',
          created_at: new Date('2024-11-02T18:00:00Z'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          card_id: cardId,
          author_id: '550e8400-e29b-41d4-a716-446655440004',
          content: 'Second comment',
          created_at: new Date('2024-11-02T18:05:00Z'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      };

      pgService.query.mockResolvedValue(mockResult as any);

      const result = await service.listComments(cardId);

      expect(pgService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          values: expect.any(Array),
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockRows[0].id,
        cardId,
        content: 'First comment',
      });
      expect(result[1]).toMatchObject({
        id: mockRows[1].id,
        cardId,
        content: 'Second comment',
      });
    });
  });
});
