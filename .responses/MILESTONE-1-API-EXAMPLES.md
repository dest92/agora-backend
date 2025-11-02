# Milestone 1 — API Examples

## Prerequisites

1. Server running: `npm run start:dev`
2. Valid JWT token from Supabase Auth
3. Database with `boards.cards` table (see `.context/db.md`)

## Get JWT Token

### Option 1: Supabase Dashboard
1. Go to your Supabase project → **Authentication** → **Users**
2. Create a test user or select existing
3. Copy the access token

### Option 2: Supabase Client (Node.js)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nvyxecumnhksxkaydfxi.supabase.co',
  'YOUR_ANON_KEY'
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

console.log('Access Token:', data.session.access_token);
```

## API Endpoints

### 1. Create Card

**Endpoint**: `POST /boards/:boardId/cards`  
**Auth**: Required (JWT)  
**Content-Type**: `application/json`

#### Example 1: Minimal Card

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Implement user authentication"
  }'
```

**Response (201 Created)**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "authorId": "user-uuid-from-jwt",
  "content": "Implement user authentication",
  "laneId": null,
  "priority": "normal",
  "position": 1000,
  "createdAt": "2024-11-02T18:30:00.000Z",
  "updatedAt": "2024-11-02T18:30:00.000Z",
  "archivedAt": null
}
```

#### Example 2: Card with Lane

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Design landing page mockup",
    "laneId": "lane-uuid-todo"
  }'
```

#### Example 3: Card with Priority

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Fix critical security vulnerability",
    "priority": "urgent"
  }'
```

#### Example 4: Card with Custom Position

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Update documentation",
    "position": 500
  }'
```

#### Example 5: Complete Card

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Refactor payment processing module",
    "laneId": "lane-uuid-in-progress",
    "priority": "high",
    "position": 750
  }'
```

### 2. List Cards

**Endpoint**: `GET /boards/:boardId/cards`  
**Auth**: Required (JWT)  
**Query Params**: `laneId` (optional, UUID)

#### Example 1: All Cards in Board

```bash
curl http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK)**:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "boardId": "550e8400-e29b-41d4-a716-446655440000",
    "authorId": "user-uuid-1",
    "content": "Update documentation",
    "laneId": null,
    "priority": "normal",
    "position": 500,
    "createdAt": "2024-11-02T18:25:00.000Z",
    "updatedAt": "2024-11-02T18:25:00.000Z",
    "archivedAt": null
  },
  {
    "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "boardId": "550e8400-e29b-41d4-a716-446655440000",
    "authorId": "user-uuid-2",
    "content": "Implement user authentication",
    "laneId": "lane-uuid-todo",
    "priority": "normal",
    "position": 1000,
    "createdAt": "2024-11-02T18:30:00.000Z",
    "updatedAt": "2024-11-02T18:30:00.000Z",
    "archivedAt": null
  }
]
```

#### Example 2: Cards Filtered by Lane

```bash
curl "http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards?laneId=lane-uuid-todo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK)**:
```json
[
  {
    "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "boardId": "550e8400-e29b-41d4-a716-446655440000",
    "authorId": "user-uuid-2",
    "content": "Implement user authentication",
    "laneId": "lane-uuid-todo",
    "priority": "normal",
    "position": 1000,
    "createdAt": "2024-11-02T18:30:00.000Z",
    "updatedAt": "2024-11-02T18:30:00.000Z",
    "archivedAt": null
  }
]
```

## Error Responses

### 400 Bad Request - Invalid UUID

```bash
curl -X POST http://localhost:3000/boards/invalid-uuid/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}'
```

**Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

### 400 Bad Request - Validation Error

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "",
    "priority": "invalid"
  }'
```

**Response**:
```json
{
  "statusCode": 400,
  "message": [
    "content must be longer than or equal to 1 characters",
    "priority must be one of the following values: low, normal, high, urgent"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized - Missing Token

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}'
```

**Response**:
```json
{
  "statusCode": 401,
  "message": "Missing authorization token",
  "error": "Unauthorized"
}
```

### 401 Unauthorized - Invalid Token

```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/cards \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}'
```

**Response**:
```json
{
  "statusCode": 401,
  "message": "Invalid token format",
  "error": "Unauthorized"
}
```

## Realtime Event Subscription

To listen for card creation events, subscribe to the Supabase Realtime channel:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nvyxecumnhksxkaydfxi.supabase.co',
  'YOUR_ANON_KEY'
);

const boardId = '550e8400-e29b-41d4-a716-446655440000';
const channel = supabase.channel(`room:board:${boardId}`);

channel
  .on('broadcast', { event: 'card:created' }, (payload) => {
    console.log('New card created:', payload);
    // {
    //   cardId: "uuid",
    //   boardId: "uuid",
    //   content: "string",
    //   authorId: "uuid",
    //   laneId: "uuid | null",
    //   priority: "normal",
    //   position: 1000,
    //   createdAt: "2024-11-02T18:30:00.000Z"
    // }
  })
  .subscribe();
```

## PowerShell Examples

For Windows users using PowerShell:

### Create Card
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$boardId = "550e8400-e29b-41d4-a716-446655440000"

$body = @{
    content = "Implement user authentication"
    priority = "high"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### List Cards
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$boardId = "550e8400-e29b-41d4-a716-446655440000"

Invoke-RestMethod `
  -Uri "http://localhost:3000/boards/$boardId/cards" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }
```

## Testing Workflow

1. **Start the server**:
   ```powershell
   npm run start:dev
   ```

2. **Get a JWT token** from Supabase Auth

3. **Create a card**:
   ```bash
   curl -X POST http://localhost:3000/boards/YOUR_BOARD_ID/cards \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test card"}'
   ```

4. **Verify in database**:
   ```sql
   SELECT * FROM boards.cards ORDER BY created_at DESC LIMIT 1;
   ```

5. **List cards**:
   ```bash
   curl http://localhost:3000/boards/YOUR_BOARD_ID/cards \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

6. **Check realtime event** in Supabase Dashboard → Realtime → Logs

---

**Tip**: Use tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for easier API testing with saved requests and environments.
