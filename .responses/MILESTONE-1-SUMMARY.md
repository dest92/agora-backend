# Milestone 1 — Boards Minimal Flow ✅

## Summary

Implemented card creation and listing with SQL queries, realtime event publishing, and unit tests.

## Updated File Tree

```
src/boards/
├── dto/
│   ├── create-card.dto.ts        # NEW - Validation for card creation
│   └── list-cards.query.ts       # NEW - Query params for listing
├── types/
│   └── card.types.ts              # NEW - Card type definitions
├── boards.controller.ts           # UPDATED - POST/GET endpoints
├── boards.service.ts              # UPDATED - SQL queries + realtime
├── boards.service.spec.ts         # UPDATED - Unit tests
└── boards.module.ts               # (no changes needed)
```

## Implemented Features

### 1. POST /boards/:boardId/cards ✅

**Controller** (`boards.controller.ts`):
- Validates `boardId` as UUID with `ParseUUIDPipe`
- Validates request body with `CreateCardDto`
- Extracts `userId` from JWT via `@CurrentUser()` decorator
- Returns `201 Created` with card entity

**Service** (`boards.service.ts`):
- Executes parameterized INSERT query using `sql` helper
- Sets defaults: `priority='normal'`, `position=1000`
- Publishes realtime event to `room:board:{boardId}` channel
- Event: `card:created` with payload:
  ```json
  {
    "cardId": "uuid",
    "boardId": "uuid",
    "content": "string",
    "authorId": "uuid",
    "laneId": "uuid | null",
    "priority": "low | normal | high | urgent",
    "position": 1000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
  ```

**SQL Query**:
```sql
INSERT INTO boards.cards (board_id, author_id, content, lane_id, priority, position)
VALUES ($1, $2, $3, $4, COALESCE($5, 'normal'), COALESCE($6, 1000))
RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
```

### 2. GET /boards/:boardId/cards?laneId=... ✅

**Controller**:
- Validates `boardId` as UUID
- Validates optional `laneId` query param with `ListCardsQuery`
- Returns `200 OK` with array of cards

**Service**:
- Executes parameterized SELECT query
- Filters by `boardId` and optional `laneId`
- Excludes archived cards (`archived_at IS NULL`)
- Orders by `position ASC, created_at ASC`

**SQL Query**:
```sql
SELECT id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at
FROM boards.cards
WHERE board_id = $1
  AND ($2::uuid IS NULL OR lane_id = $2::uuid)
  AND archived_at IS NULL
ORDER BY position ASC, created_at ASC
```

### 3. DTOs ✅

**CreateCardDto** (`dto/create-card.dto.ts`):
```typescript
{
  content: string;      // required, 1-2000 chars
  laneId?: string;      // optional UUID
  priority?: CardPriority; // optional: low | normal | high | urgent
  position?: number;    // optional, default 1000
}
```

**ListCardsQuery** (`dto/list-cards.query.ts`):
```typescript
{
  laneId?: string;      // optional UUID
}
```

### 4. Types ✅

**Card** (`types/card.types.ts`):
```typescript
{
  id: string;
  boardId: string;
  authorId: string;
  content: string;
  laneId: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  position: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}
```

**CardRow** (DB row mapping):
```typescript
{
  id: string;
  board_id: string;
  author_id: string;
  content: string;
  lane_id: string | null;
  priority: CardPriority;
  position: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}
```

### 5. Unit Tests ✅

**boards.service.spec.ts**:
- ✅ `createCard()` - Happy path with mocked PgService and RealtimeService
- ✅ `listCards()` - Happy path with mocked PgService
- Verifies:
  - SQL query called with correct parameters
  - `RealtimeService.publish()` called with correct channel/event/payload
  - Returned card matches expected structure

## Curl Examples

### Create Card (requires JWT)

```bash
# Basic card
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Implement user authentication"
  }'

# Card with all fields
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Fix bug in payment flow",
    "laneId": "550e8400-e29b-41d4-a716-446655440001",
    "priority": "urgent",
    "position": 500
  }'
```

**Response (201 Created)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "authorId": "550e8400-e29b-41d4-a716-446655440002",
  "content": "Implement user authentication",
  "laneId": null,
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "archivedAt": null
}
```

### List Cards (requires JWT)

```bash
# All cards in board
curl http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Cards filtered by lane
curl "http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards?laneId=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK)**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "boardId": "550e8400-e29b-41d4-a716-446655440000",
    "authorId": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Implement user authentication",
    "laneId": null,
    "priority": "normal",
    "position": 1000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "archivedAt": null
  }
]
```

## Realtime Event

When a card is created, the following event is published to Supabase Realtime:

**Channel**: `room:board:{boardId}`  
**Event**: `card:created`  
**Payload**:
```json
{
  "cardId": "550e8400-e29b-41d4-a716-446655440003",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Implement user authentication",
  "authorId": "550e8400-e29b-41d4-a716-446655440002",
  "laneId": null,
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing

Run unit tests:
```powershell
npm test boards.service.spec.ts
```

Expected output:
```
PASS  src/boards/boards.service.spec.ts
  BoardsService
    ✓ should be defined
    createCard
      ✓ should create a card and publish realtime event
    listCards
      ✓ should list all cards for a board
```

## Code Quality

✅ **Strict TypeScript** - No `any`, all types declared  
✅ **SOLID** - Single responsibility, dependency injection  
✅ **Clean Architecture** - Domain types, application services, infrastructure adapters  
✅ **Parameterized Queries** - SQL injection prevention via `sql` helper  
✅ **Validation** - DTOs with class-validator decorators  
✅ **Testing** - Unit tests with mocked dependencies  
✅ **One Export Per File** - Each file exports single class/interface  

## Architecture Alignment

✅ **Hexagonal** - Service uses PgService (infrastructure adapter)  
✅ **CQRS-ready** - Separate command (createCard) and query (listCards) methods  
✅ **Event-Driven** - Publishes domain events via RealtimeService  
✅ **Database as Source of Truth** - Aligned with `.context/db.md` schema  

## Next Steps (Milestone 2)

Potential enhancements:
- Card update endpoint (PATCH /boards/:boardId/cards/:cardId)
- Card archiving (soft delete)
- Card reordering (update position)
- Bulk operations
- Pagination for large boards
- Integration tests with Testcontainers

---

**Status**: Milestone 1 complete ✅
