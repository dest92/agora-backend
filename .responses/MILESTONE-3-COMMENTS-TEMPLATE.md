# Milestone 3 — Comments Feature (Canonical Template)

## Summary

Complete implementation of Comments feature as a template for Votes, Tags, and Assignees.

## File Tree

```
src/boards/
├── dto/
│   └── create-comment.dto.ts     # NEW - Validation for comment creation
├── comments.controller.ts         # NEW - HTTP endpoints
├── comments.service.ts            # NEW - Business logic + SQL + realtime
├── comments.service.spec.ts       # NEW - Unit tests (3/3 passing)
└── boards.module.ts               # UPDATED - Register Comments

.responses/
└── MILESTONE-3-COMMENTS-TEMPLATE.md  # NEW (this file)
```

## Implementation

### DTO (`create-comment.dto.ts`)
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
```

### Service (`comments.service.ts`)
**Pattern**:
1. Inject `PgService` and `RealtimeService`
2. Execute parameterized SQL query
3. Map DB rows to domain objects
4. Publish realtime event on success
5. Return result

**Key Methods**:
- `addComment(cardId, authorId, content, boardId)` → INSERT + publish
- `listComments(cardId)` → SELECT

**SQL**:
```sql
-- INSERT
INSERT INTO boards.comments (card_id, author_id, content)
VALUES ($1, $2, $3)
RETURNING id, card_id, author_id, content, created_at;

-- SELECT
SELECT id, card_id, author_id, content, created_at
FROM boards.comments
WHERE card_id = $1
ORDER BY created_at ASC;
```

### Controller (`comments.controller.ts`)
**Pattern**:
1. Route: `@Controller('boards/:boardId/cards/:cardId/comments')`
2. Validate UUIDs with `ParseUUIDPipe`
3. Extract user from `@CurrentUser()`
4. Call service method
5. Return 201 (POST) or 200 (GET)

**Endpoints**:
- `POST /` → Create comment (201)
- `GET /` → List comments (200)

### Tests (`comments.service.spec.ts`)
**Pattern**:
1. Mock `PgService` and `RealtimeService`
2. Test happy paths
3. Assert SQL query called
4. Assert realtime event published with correct payload

**Tests** (3/3 passing):
- ✓ should be defined
- ✓ should add comment and publish event
- ✓ should list comments for a card

## Build & Test Results

### Build ✅
```powershell
npm run build
# Exit code: 0 (success)
```

### Tests ✅
```powershell
npm test -- comments.service.spec.ts
# PASS  src/boards/comments.service.spec.ts
#   CommentsService
#     ✓ should be defined
#     addComment
#       ✓ should add comment and publish event
#     listComments
#       ✓ should list comments for a card
# Test Suites: 1 passed, 1 total
# Tests:       3 passed, 3 total
```

## Curl Examples

### Add Comment
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great work on this task! Ready for review."
  }'
```

**Response (201 Created)**:
```json
{
  "id": "comment-uuid",
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "authorId": "user-uuid-from-jwt",
  "content": "Great work on this task! Ready for review.",
  "createdAt": "2024-11-02T18:45:00.000Z"
}
```

**Realtime Event**: `comment:added`
```json
{
  "commentId": "comment-uuid",
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "authorId": "user-uuid-from-jwt",
  "content": "Great work on this task! Ready for review.",
  "createdAt": "2024-11-02T18:45:00.000Z"
}
```

### List Comments
```bash
curl http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK)**:
```json
[
  {
    "id": "comment-uuid-1",
    "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "authorId": "user-uuid-1",
    "content": "First comment",
    "createdAt": "2024-11-02T18:00:00.000Z"
  },
  {
    "id": "comment-uuid-2",
    "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "authorId": "user-uuid-2",
    "content": "Second comment",
    "createdAt": "2024-11-02T18:05:00.000Z"
  }
]
```

## How to Replicate for Other Features

### File Layout Pattern

For each feature (Votes, Tags, Assignees):

```
src/boards/
├── dto/
│   └── create-{feature}.dto.ts    # If needed (e.g., CreateTagDto)
├── {feature}.controller.ts        # HTTP endpoints
├── {feature}.service.ts           # Business logic + SQL + realtime
├── {feature}.service.spec.ts      # Unit tests
└── boards.module.ts               # Register controller + service
```

### Service Pattern

```typescript
@Injectable()
export class {Feature}Service {
  constructor(
    private readonly pg: PgService,
    private readonly realtime: RealtimeService,
  ) {}

  async {action}(...params): Promise<Result> {
    // 1. Execute SQL query
    const query = sql`...`;
    const result = await this.pg.query<Row>(query);
    
    // 2. Map row to domain object
    const entity = this.mapRowToEntity(result.rows[0]);
    
    // 3. Publish realtime event
    await this.realtime.publish(
      `room:board:${boardId}`,
      '{event}:{action}',
      payload,
    );
    
    // 4. Return result
    return entity;
  }
}
```

### Controller Pattern

```typescript
@Controller('boards/:boardId/...')
export class {Feature}Controller {
  constructor(private readonly service: {Feature}Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async {action}(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: Dto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.{action}(...);
  }
}
```

### Test Pattern

```typescript
describe('{Feature}Service', () => {
  let service: {Feature}Service;
  let pgService: jest.Mocked<PgService>;
  let realtimeService: jest.Mocked<RealtimeService>;

  beforeEach(async () => {
    // Mock setup
  });

  it('should {action} and publish event', async () => {
    // Arrange: mock data
    // Act: call service method
    // Assert: query called, event published, result correct
  });
});
```

## Event Names by Feature

| Feature | Events |
|---------|--------|
| **Comments** | `comment:added` |
| **Votes** | `vote:cast`, `vote:removed` |
| **Tags** | `tag:created`, `tag:assigned`, `tag:unassigned` |
| **Assignees** | `assignee:added`, `assignee:removed` |

## SQL Patterns

### Comments (✅ Implemented)
```sql
INSERT INTO boards.comments (card_id, author_id, content)
VALUES ($1, $2, $3)
RETURNING id, card_id, author_id, content, created_at;
```

### Votes (Template)
```sql
INSERT INTO boards.votes (card_id, voter_id, kind)
VALUES ($1, $2, $3)
ON CONFLICT (card_id, voter_id) DO UPDATE SET kind = EXCLUDED.kind
RETURNING id, card_id, voter_id, kind, created_at;
```

### Tags (Template)
```sql
INSERT INTO boards.tags (board_id, label, color)
VALUES ($1, $2, $3)
ON CONFLICT (board_id, label) DO UPDATE SET color = COALESCE(EXCLUDED.color, boards.tags.color)
RETURNING id, board_id, label, color;
```

### Assignees (Template)
```sql
INSERT INTO boards.card_assignees (card_id, user_id)
VALUES ($1, $2)
ON CONFLICT (card_id, user_id) DO NOTHING
RETURNING card_id, user_id, assigned_at;
```

## Next Steps

1. **Replicate for Votes**:
   - Create `votes.service.ts`, `votes.controller.ts`, `votes.service.spec.ts`
   - Endpoints: POST `/votes/up`, POST `/votes/down`, DELETE `/votes`
   - Events: `vote:cast`, `vote:removed`

2. **Replicate for Tags**:
   - Create `tags.service.ts`, `tags.controller.ts`, `tags.service.spec.ts`
   - Create `dto/create-tag.dto.ts`
   - Endpoints: POST `/tags`, GET `/tags`, POST `/cards/:cardId/tags/:tagId`, DELETE `/cards/:cardId/tags/:tagId`
   - Events: `tag:created`, `tag:assigned`, `tag:unassigned`

3. **Replicate for Assignees**:
   - Create `assignees.service.ts`, `assignees.controller.ts`, `assignees.service.spec.ts`
   - Endpoints: POST `/cards/:cardId/assignees/:userId`, DELETE `/cards/:cardId/assignees/:userId`
   - Events: `assignee:added`, `assignee:removed`

4. **Register in Module**:
   - Add all controllers and services to `boards.module.ts`

---

**Status**: Comments feature complete as canonical template ✅

Use this pattern to implement Votes, Tags, and Assignees with confidence!
