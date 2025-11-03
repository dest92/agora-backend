# Milestone 3 — Votes Feature ✅

## Summary

Complete implementation of Votes feature following the Comments template pattern.

## File Tree

```
src/boards/
├── votes.controller.ts         # NEW - HTTP endpoints
├── votes.service.ts            # NEW - Business logic + SQL + realtime
├── votes.service.spec.ts       # NEW - Unit tests (4/4 passing)
└── boards.module.ts            # UPDATED - Register Votes

.responses/
└── MILESTONE-3-VOTES-COMPLETE.md  # NEW (this file)
```

## Implementation

### Service (`votes.service.ts`)

**Key Methods**:
- `castVote(cardId, voterId, kind, boardId)` → INSERT/UPDATE + publish `vote:cast`
- `removeVote(cardId, voterId, boardId)` → DELETE + publish `vote:removed`

**SQL**:
```sql
-- INSERT/UPDATE (toggle)
INSERT INTO boards.votes (card_id, voter_id, kind)
VALUES ($1, $2, $3)
ON CONFLICT (card_id, voter_id) DO UPDATE SET kind = EXCLUDED.kind
RETURNING id, card_id, voter_id, kind, created_at;

-- DELETE
DELETE FROM boards.votes WHERE card_id = $1 AND voter_id = $2;
```

**Behavior**:
- `ON CONFLICT` ensures idempotency: same user can only have one vote per card
- Voting again with different kind toggles the vote (up ↔ down)
- Delete removes vote regardless of kind

### Controller (`votes.controller.ts`)

**Routes**:
- `POST /boards/:boardId/cards/:cardId/votes/up` → Vote up (201)
- `POST /boards/:boardId/cards/:cardId/votes/down` → Vote down (201)
- `DELETE /boards/:boardId/cards/:cardId/votes` → Remove vote (204)

**Pattern**:
- Validate UUIDs with `ParseUUIDPipe`
- Extract `voterId` from `@CurrentUser()`
- Call service method
- Return 201 (create) or 204 (delete)

### Tests (`votes.service.spec.ts`)

**Tests** (4/4 passing):
- ✓ should be defined
- ✓ should cast vote up and publish event
- ✓ should toggle vote from up to down
- ✓ should remove vote and publish event

## Build & Test Results

### Build ✅
```powershell
npm run build
# Exit code: 0 (success)
```

### Tests ✅
```powershell
npm test -- votes.service.spec.ts
# PASS  src/boards/votes.service.spec.ts
#   VotesService
#     ✓ should be defined
#     castVote
#       ✓ should cast vote up and publish event
#       ✓ should toggle vote from up to down
#     removeVote
#       ✓ should remove vote and publish event
# Test Suites: 1 passed, 1 total
# Tests:       4 passed, 4 total
```

## Curl Examples

### Vote Up
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/votes/up \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (201 Created)**:
```json
{
  "id": "vote-uuid",
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "voterId": "user-uuid-from-jwt",
  "kind": "up",
  "createdAt": "2024-11-02T23:00:00.000Z"
}
```

**Realtime Event**: `vote:cast` → `room:board:{boardId}`
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "voterId": "user-uuid-from-jwt",
  "kind": "up"
}
```

### Vote Down
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/votes/down \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (201 Created)**:
```json
{
  "id": "vote-uuid",
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "voterId": "user-uuid-from-jwt",
  "kind": "down",
  "createdAt": "2024-11-02T23:00:00.000Z"
}
```

**Realtime Event**: `vote:cast`
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "voterId": "user-uuid-from-jwt",
  "kind": "down"
}
```

### Toggle Vote (Up → Down)
If user already voted "up", calling vote down will toggle:

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/votes/down \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**: Same as vote down (kind changes to "down")

**Realtime Event**: `vote:cast` with `kind: "down"`

### Remove Vote
```bash
curl -X DELETE http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/votes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (204 No Content)**: Empty body

**Realtime Event**: `vote:removed` → `room:board:{boardId}`
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "voterId": "user-uuid-from-jwt"
}
```

## PowerShell Examples

### Vote Up
```powershell
$token = "YOUR_JWT_TOKEN"
$boardId = "550e8400-e29b-41d4-a716-446655440000"
$cardId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId/votes/up" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" }
```

### Vote Down
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId/votes/down" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" }
```

### Remove Vote
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId/votes" `
  -Method Delete `
  -Headers @{ Authorization = "Bearer $token" }
```

## Realtime Events

All events published to channel: `room:board:{boardId}`

### vote:cast
**Triggered when**: User votes up or down (including toggle)

**Payload**:
```json
{
  "cardId": "uuid",
  "voterId": "uuid",
  "kind": "up" | "down"
}
```

### vote:removed
**Triggered when**: User removes their vote

**Payload**:
```json
{
  "cardId": "uuid",
  "voterId": "uuid"
}
```

## Key Features

✅ **Idempotency** - `ON CONFLICT` ensures one vote per user per card  
✅ **Toggle Support** - Voting again with different kind updates the vote  
✅ **Clean Delete** - Remove vote without knowing current kind  
✅ **Realtime Events** - Publish after successful operations  
✅ **Type Safety** - `VoteKind = 'up' | 'down'` type  
✅ **Tests** - 4/4 passing with mocked dependencies  

## Code Quality

✅ **TypeScript Strict Mode** - All types declared  
✅ **SOLID Principles** - Single responsibility per method  
✅ **Parameterized SQL** - Injection prevention  
✅ **Realtime Events** - Published after success  
✅ **Error Handling** - Throws on failure  
✅ **One Export Per File** - Modular structure  

## Comparison with Comments Template

| Aspect | Comments | Votes |
|--------|----------|-------|
| **DTO** | CreateCommentDto | None (no body) |
| **Endpoints** | POST, GET | POST (up/down), DELETE |
| **SQL** | INSERT, SELECT | INSERT ON CONFLICT, DELETE |
| **Events** | 1 (comment:added) | 2 (vote:cast, vote:removed) |
| **Idempotency** | No conflict handling | ON CONFLICT DO UPDATE |
| **Tests** | 3 | 4 (includes toggle test) |

## Next Steps

Remaining features for Milestone 3:
1. **Tags** - Create/list tags, assign/unassign to cards
2. **Assignees** - Add/remove users to cards

Both follow the same pattern established by Comments and Votes.

---

**Status**: Votes feature complete ✅

Ready to implement Tags and Assignees!
