# Milestone 3 — Collaboration Features (Plan)

## Overview

Milestone 3 adds collaboration features: Comments, Votes, Tags, and Assignees with realtime events.

## File Structure

```
src/boards/
├── dto/
│   ├── create-comment.dto.ts     # NEW
│   └── create-tag.dto.ts          # NEW
├── comments.controller.ts         # NEW
├── comments.service.ts            # NEW
├── comments.service.spec.ts       # NEW
├── votes.controller.ts            # NEW
├── votes.service.ts               # NEW
├── votes.service.spec.ts          # NEW
├── tags.controller.ts             # NEW
├── tags.service.ts                # NEW
├── tags.service.spec.ts           # NEW
├── assignees.controller.ts        # NEW
├── assignees.service.ts           # NEW
├── assignees.service.spec.ts      # NEW
└── boards.module.ts               # UPDATED - import all new controllers/services
```

## Implementation Pattern

All services follow the same pattern:
1. Inject `PgService` and `RealtimeService`
2. Execute parameterized SQL query
3. Publish realtime event on success
4. Return result

All controllers follow the same pattern:
1. Validate UUIDs with `ParseUUIDPipe`
2. Extract user from `@CurrentUser()`
3. Call service method
4. Return 201 (create) or 200 (others)

## API Endpoints Summary

### Comments
- `POST /boards/:boardId/cards/:cardId/comments` → Create comment
- `GET /boards/:boardId/cards/:cardId/comments` → List comments

### Votes
- `POST /boards/:boardId/cards/:cardId/votes/up` → Vote up (toggle)
- `POST /boards/:boardId/cards/:cardId/votes/down` → Vote down (toggle)
- `DELETE /boards/:boardId/cards/:cardId/votes` → Remove vote

### Tags
- `POST /boards/:boardId/tags` → Create tag
- `GET /boards/:boardId/tags` → List tags
- `POST /boards/:boardId/cards/:cardId/tags/:tagId` → Assign tag
- `DELETE /boards/:boardId/cards/:cardId/tags/:tagId` → Unassign tag

### Assignees
- `POST /boards/:boardId/cards/:cardId/assignees/:userId` → Add assignee
- `DELETE /boards/:boardId/cards/:cardId/assignees/:userId` → Remove assignee

## Realtime Events

All events published to: `room:board:{boardId}`

| Event | Payload |
|-------|---------|
| `comment:added` | `{ cardId, commentId, authorId, content, createdAt }` |
| `vote:cast` | `{ cardId, voterId, kind }` |
| `vote:removed` | `{ cardId, voterId }` |
| `tag:created` | `{ tagId, boardId, label, color }` |
| `tag:assigned` | `{ cardId, tagId }` |
| `tag:unassigned` | `{ cardId, tagId }` |
| `assignee:added` | `{ cardId, userId }` |
| `assignee:removed` | `{ cardId, userId }` |

## Curl Examples

### Comments
```bash
# Add comment
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great work on this!"}'

# List comments
curl http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/comments \
  -H "Authorization: Bearer TOKEN"
```

### Votes
```bash
# Vote up
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/votes/up \
  -H "Authorization: Bearer TOKEN"

# Vote down
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/votes/down \
  -H "Authorization: Bearer TOKEN"

# Remove vote
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/votes \
  -H "Authorization: Bearer TOKEN"
```

### Tags
```bash
# Create tag
curl -X POST http://localhost:3000/boards/BOARD_ID/tags \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "Bug", "color": "#ff0000"}'

# List tags
curl http://localhost:3000/boards/BOARD_ID/tags \
  -H "Authorization: Bearer TOKEN"

# Assign tag to card
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/tags/TAG_ID \
  -H "Authorization: Bearer TOKEN"

# Unassign tag
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/tags/TAG_ID \
  -H "Authorization: Bearer TOKEN"
```

### Assignees
```bash
# Add assignee
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Remove assignee
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

Due to the extensive nature of this milestone (12+ new files with similar patterns), I recommend:

1. **Implement incrementally** - Start with one feature (e.g., Comments) and test thoroughly
2. **Use code generation** - The pattern is repetitive, so templates can speed up development
3. **Focus on tests** - Each service needs happy-path tests with mocked dependencies
4. **Bruno collections** - Create organized API collections for testing

Would you like me to:
- **A)** Generate complete implementation for ONE feature (Comments) as a template?
- **B)** Generate all services/controllers with minimal implementation?
- **C)** Focus on a specific aspect (tests, Bruno collections, etc.)?

Please specify your preference and I'll proceed accordingly.
