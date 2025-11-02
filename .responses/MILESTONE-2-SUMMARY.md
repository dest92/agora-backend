# Milestone 2 — Card Update Flows ✅

## Summary

Implemented card update operations (content/priority/position/lane), archive/unarchive, and projections refresh with realtime events.

## Updated File Tree

```
src/boards/
├── dto/
│   ├── create-card.dto.ts        # (no changes)
│   ├── list-cards.query.ts       # (no changes)
│   └── update-card.dto.ts        # NEW - Validation for updates
├── types/
│   └── card.types.ts             # (no changes)
├── boards.controller.ts          # UPDATED - PATCH, archive, unarchive, refresh
├── boards.service.ts             # UPDATED - New methods
├── boards.service.spec.ts        # UPDATED - Extended tests (5 total)
└── boards.module.ts              # (no changes)
```

## Implemented Features

### 1. PATCH /boards/:boardId/cards/:cardId ✅

**Functionality**:
- Updates only provided fields (content, laneId, priority, position)
- Validates at least one field is provided (400 if empty body)
- Detects lane changes and publishes appropriate event
- Returns updated card

**SQL Query**:
```sql
UPDATE boards.cards
SET
  content = COALESCE($3, content),
  lane_id = COALESCE($4::uuid, lane_id),
  priority = COALESCE($5, priority),
  position = COALESCE($6, position),
  updated_at = now()
WHERE id = $1 AND board_id = $2
RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
```

**Realtime Events**:
- `card:moved` - When `laneId` changes
- `card:updated` - When other fields change

**Payload**:
```json
{
  "cardId": "uuid",
  "boardId": "uuid",
  "laneId": "uuid | null",
  "priority": "low | normal | high | urgent",
  "position": 1000,
  "content": "string",
  "archived": false,
  "updatedAt": "2024-11-02T18:30:00.000Z"
}
```

### 2. POST /boards/:boardId/cards/:cardId/archive ✅

**Functionality**:
- Sets `archived_at = now()`
- Only archives if not already archived
- Publishes `card:archived` event
- Returns archived card

**SQL Query**:
```sql
UPDATE boards.cards
SET archived_at = now()
WHERE id = $1 AND board_id = $2 AND archived_at IS NULL
RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
```

**Realtime Event**: `card:archived`

### 3. POST /boards/:boardId/cards/:cardId/unarchive ✅

**Functionality**:
- Sets `archived_at = NULL`
- Only unarchives if currently archived
- Updates `updated_at` timestamp
- Publishes `card:unarchived` event
- Returns unarchived card

**SQL Query**:
```sql
UPDATE boards.cards
SET archived_at = NULL, updated_at = now()
WHERE id = $1 AND board_id = $2 AND archived_at IS NOT NULL
RETURNING id, board_id, author_id, content, lane_id, priority, position, created_at, updated_at, archived_at
```

**Realtime Event**: `card:unarchived`

### 4. POST /boards/:boardId/projections/refresh ✅

**Functionality**:
- Calls `projections.refresh_mv_board_lane_counts()`
- Calls `projections.refresh_mv_card_counters()`
- Ignores errors if views don't exist
- Returns `{ refreshed: true }`

**SQL Queries**:
```sql
SELECT projections.refresh_mv_board_lane_counts();
SELECT projections.refresh_mv_card_counters();
```

## DTOs

### UpdateCardDto
```typescript
{
  content?: string;      // optional, 1-2000 chars
  laneId?: string;       // optional UUID
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  position?: number;     // optional
}
```

**Validation**:
- At least one field must be provided (checked in controller)
- Each field validated independently if present

## Realtime Events Summary

| Event | Trigger | Payload |
|-------|---------|---------|
| `card:created` | POST /cards | cardId, boardId, content, authorId, laneId, priority, position, createdAt |
| `card:updated` | PATCH /cards (no lane change) | cardId, boardId, laneId, priority, position, content, archived, updatedAt |
| `card:moved` | PATCH /cards (lane changed) | cardId, boardId, laneId, priority, position, content, archived, updatedAt |
| `card:archived` | POST /archive | cardId, boardId, laneId, priority, position, archived, updatedAt |
| `card:unarchived` | POST /unarchive | cardId, boardId, laneId, priority, position, archived, updatedAt |

All events published to channel: `room:board:{boardId}`

## Tests

```
PASS  src/boards/boards.service.spec.ts
  BoardsService
    ✓ should be defined
    createCard
      ✓ should create a card and publish realtime event
    listCards
      ✓ should list all cards for a board
    updateCard
      ✓ should update card and publish event
    archiveCard
      ✓ should archive card and publish event

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

## Curl Examples

### Update Card Content & Priority
```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated card content",
    "priority": "urgent"
  }'
```

### Move Card to Another Lane
```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laneId": "lane-uuid-in-progress",
    "position": 500
  }'
```

### Archive Card
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Unarchive Card
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/unarchive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Refresh Projections
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/projections/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Code Quality

✅ **Strict TypeScript** - All types declared  
✅ **SOLID** - Single responsibility per method  
✅ **Parameterized Queries** - SQL injection prevention  
✅ **Realtime Events** - Published after successful operations  
✅ **Error Handling** - Throws on card not found  
✅ **Tests** - 5/5 passing with mocked dependencies  
✅ **One Export Per File** - Modular structure maintained  

## Acceptance Criteria Met

✅ PATCH updates only provided fields  
✅ Returns updated card  
✅ Lane change → publishes `card:moved`  
✅ Other updates → publishes `card:updated`  
✅ Archive sets `archived_at` and publishes `card:archived`  
✅ Unarchive clears `archived_at` and publishes `card:unarchived`  
✅ Projections refresh executes both functions  
✅ All events to `room:board:{boardId}` with correct payload  
✅ Tests for service methods (happy-path)  

---

**Status**: Milestone 2 complete ✅
