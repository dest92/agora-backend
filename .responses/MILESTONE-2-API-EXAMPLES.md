# Milestone 2 — API Examples

## Card Update Operations

### 1. Update Card Content

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated task description with more details"
  }'
```

**Response (200 OK)**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "authorId": "user-uuid",
  "content": "Updated task description with more details",
  "laneId": "lane-uuid-todo",
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-11-02T18:00:00.000Z",
  "updatedAt": "2024-11-02T18:35:00.000Z",
  "archivedAt": null
}
```

**Realtime Event**: `card:updated`

### 2. Update Card Priority

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "urgent"
  }'
```

**Realtime Event**: `card:updated`

### 3. Move Card to Another Lane

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laneId": "lane-uuid-in-progress"
  }'
```

**Realtime Event**: `card:moved` (because lane changed)

### 4. Move Card and Reorder

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laneId": "lane-uuid-done",
    "position": 500
  }'
```

**Realtime Event**: `card:moved`

### 5. Reorder Card (Same Lane)

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": 250
  }'
```

**Realtime Event**: `card:updated`

### 6. Update Multiple Fields

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Refactored payment module",
    "priority": "high",
    "position": 100
  }'
```

**Realtime Event**: `card:updated` (if lane didn't change)

## Archive Operations

### 7. Archive Card

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK)**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "authorId": "user-uuid",
  "content": "Task content",
  "laneId": "lane-uuid-done",
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-11-02T18:00:00.000Z",
  "updatedAt": "2024-11-02T18:30:00.000Z",
  "archivedAt": "2024-11-02T18:40:00.000Z"
}
```

**Realtime Event**: `card:archived`

### 8. Unarchive Card

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/unarchive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK)**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "authorId": "user-uuid",
  "content": "Task content",
  "laneId": "lane-uuid-done",
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-11-02T18:00:00.000Z",
  "updatedAt": "2024-11-02T18:45:00.000Z",
  "archivedAt": null
}
```

**Realtime Event**: `card:unarchived`

## Projections Refresh

### 9. Refresh Materialized Views

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/projections/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK)**:
```json
{
  "refreshed": true
}
```

**Note**: This endpoint calls both:
- `projections.refresh_mv_board_lane_counts()`
- `projections.refresh_mv_card_counters()`

Errors are ignored if views don't exist yet.

## Error Responses

### Empty Body (400 Bad Request)

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response**:
```json
{
  "statusCode": 400,
  "message": "At least one field must be provided",
  "error": "Bad Request"
}
```

### Invalid UUID (400 Bad Request)

```bash
curl -X PATCH http://localhost:3000/boards/invalid-uuid/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
```

**Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

### Card Not Found (500 Internal Server Error)

```bash
curl -X PATCH http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
```

**Response**:
```json
{
  "statusCode": 500,
  "message": "Card not found",
  "error": "Internal Server Error"
}
```

### Already Archived (500 Internal Server Error)

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards/a1b2c3d4-e5f6-7890-abcd-ef1234567890/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (if already archived):
```json
{
  "statusCode": 500,
  "message": "Card not found or already archived",
  "error": "Internal Server Error"
}
```

## PowerShell Examples

### Update Card
```powershell
$token = "YOUR_JWT_TOKEN"
$boardId = "550e8400-e29b-41d4-a716-446655440000"
$cardId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

$body = @{
    content = "Updated content"
    priority = "high"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId" `
  -Method Patch `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### Move Card to Another Lane
```powershell
$body = @{
    laneId = "lane-uuid-in-progress"
    position = 500
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId" `
  -Method Patch `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### Archive Card
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId/archive" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" }
```

### Unarchive Card
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards/$cardId/unarchive" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" }
```

### Refresh Projections
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/projections/refresh" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" }
```

## Realtime Event Payloads

### card:updated
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "laneId": "lane-uuid-todo",
  "priority": "high",
  "position": 1000,
  "content": "Updated content",
  "archived": false,
  "updatedAt": "2024-11-02T18:35:00.000Z"
}
```

### card:moved
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "laneId": "lane-uuid-in-progress",
  "priority": "normal",
  "position": 500,
  "content": "Task content",
  "archived": false,
  "updatedAt": "2024-11-02T18:36:00.000Z"
}
```

### card:archived
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "laneId": "lane-uuid-done",
  "priority": "normal",
  "position": 1000,
  "archived": true,
  "updatedAt": "2024-11-02T18:40:00.000Z"
}
```

### card:unarchived
```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "laneId": "lane-uuid-done",
  "priority": "normal",
  "position": 1000,
  "archived": false,
  "updatedAt": "2024-11-02T18:45:00.000Z"
}
```

## Testing Workflow

1. **Create a card** (from Milestone 1)
2. **Update content**: `PATCH /cards/:id` with `{"content": "new"}`
3. **Change priority**: `PATCH /cards/:id` with `{"priority": "urgent"}`
4. **Move to another lane**: `PATCH /cards/:id` with `{"laneId": "uuid"}`
5. **Archive**: `POST /cards/:id/archive`
6. **Unarchive**: `POST /cards/:id/unarchive`
7. **Refresh projections**: `POST /projections/refresh`

---

**Tip**: Use Postman collections to save and organize these requests for easier testing.
