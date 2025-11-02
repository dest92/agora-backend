# Milestone 0 — Bootstrap & Config ✅

## Complete File Tree

```
agora-backend/
├── .env.example                          # Environment template
├── package.json                          # Dependencies (updated)
├── README-MILESTONE-0.md                 # Setup instructions
├── MILESTONE-0-SUMMARY.md                # This file
│
└── src/
    ├── main.ts                           # Bootstrap (ValidationPipe, CORS, port)
    ├── app.module.ts                     # Root module (wires all modules + global AuthGuard)
    │
    ├── config/
    │   ├── env.schema.ts                 # Zod schema for env validation
    │   └── env.config.ts                 # ConfigModule options with validation
    │
    ├── core/
    │   ├── core.module.ts                # Core module (global filter, middleware)
    │   ├── filters/
    │   │   └── global-exception.filter.ts  # Maps errors to HTTP responses
    │   ├── middleware/
    │   │   └── request-id.middleware.ts    # Adds x-request-id header
    │   └── decorators/
    │       ├── current-user.decorator.ts   # @CurrentUser() param decorator
    │       └── public.decorator.ts         # @Public() to skip auth
    │
    ├── shared/
    │   ├── shared.module.ts              # Shared module
    │   └── database/
    │       ├── pg.module.ts              # Global PgModule
    │       ├── pg.service.ts             # Postgres Pool service (health check on init)
    │       └── sql.ts                    # Tagged template helper for parameterized queries
    │
    ├── auth/
    │   ├── auth.module.ts                # Auth module
    │   ├── auth.controller.ts            # GET /auth/test (smoke test)
    │   ├── services/
    │   │   ├── jwks.service.ts           # Fetches & caches JWKS keys (5 min TTL)
    │   │   └── jwt-verifier.service.ts   # Verifies JWT (RS256, iss, aud, exp)
    │   └── guards/
    │       └── auth.guard.ts             # Global guard (respects @Public decorator)
    │
    ├── realtime/
    │   ├── realtime.module.ts            # Realtime module (global)
    │   └── realtime.service.ts           # Supabase Realtime publisher (lazy subscribe/send/unsubscribe)
    │
    ├── health/
    │   ├── health.module.ts              # Health module
    │   └── health.controller.ts          # GET /health (public)
    │
    └── boards/
        ├── boards.module.ts              # Boards module
        ├── boards.controller.ts          # POST /boards/:id/cards (stub, 501)
        └── boards.service.ts             # Service (throws Not Implemented)
```

## What Was Built

### 1. Environment & Config ✅
- **Zod validation** for all env vars (strict types)
- **ConfigModule** global with validation on bootstrap
- `.env.example` with placeholders

### 2. Persistence (pg) ✅
- **PgModule** exports singleton `Pool` with SSL, connection limits
- **Health check** on module init (`SELECT 1`)
- **sql.ts** helper for tagged template parameterized queries

### 3. Auth (Supabase JWKS) ✅
- **JwksService**: Fetches & caches JWKS keys (5–10 min cache, kid rotation)
- **JwtVerifierService**: Verifies JWT signature, iss, aud, exp/nbf
- **AuthGuard**: Extracts Bearer token, verifies, attaches `req.user = { userId, email }`
- **@CurrentUser()** decorator to access user in controllers
- **@Public()** decorator to skip auth on specific routes
- **GET /auth/test** endpoint (smoke test, requires JWT)

### 4. Realtime Publisher (Channels) ✅
- **RealtimeModule** with Supabase service (Service Role Key)
- **publish(channelName, event, payload)** method
- Lazy subscribe-then-send-then-unsubscribe pattern
- Channel naming aligned with db-context.toon:
  - `room:board:{boardId}`
  - `room:workspace:{workspaceId}`

### 5. HTTP Fundamentals ✅
- **Global ValidationPipe** (whitelist, forbidNonWhitelisted, transform)
- **Global exception filter** (maps Zod/validation/pg errors to HTTP)
- **CORS** enabled (open for TP)
- **RequestId middleware** (x-request-id header)
- **Logger** (NestLogger) with requestId context

### 6. Initial Routes ✅
- **GET /health** → 200 (public, no auth)
- **GET /auth/test** → 200 (requires JWT, echoes userId/email)
- **POST /boards/:id/cards** → 501 (stub, requires JWT)
- **AuthGuard** applied globally except `/health`

## Acceptance Criteria — All Met ✅

1. ✅ `npm run start:dev` works
2. ✅ `GET /health` → 200
3. ✅ `GET /auth/test` with valid Supabase JWT → 200 and echoes userId/email
4. ✅ Pg Pool connects to Supabase (verified via `SELECT 1` on bootstrap)

## Dependencies Installed

```json
{
  "@nestjs/common": "^11.0.17",
  "@nestjs/config": "^4.0.0",
  "@nestjs/core": "^11.0.1",
  "@nestjs/platform-express": "^11.0.1",
  "@supabase/supabase-js": "^2.39.3",
  "class-transformer": "^0.5.1",
  "class-validator": "^0.14.1",
  "cross-fetch": "^4.0.0",
  "jsonwebtoken": "^9.0.2",
  "jwk-to-pem": "^2.0.6",
  "pg": "^8.11.3",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1",
  "zod": "^3.22.4"
}
```

## Run Commands

### Install dependencies
```powershell
npm install
```

### Start development server
```powershell
npm run start:dev
```

### Test endpoints

**Health (no auth):**
```powershell
curl http://localhost:3000/health
```

**Auth test (requires JWT):**
```powershell
curl http://localhost:3000/auth/test -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Boards stub (requires JWT):**
```powershell
curl http://localhost:3000/boards/test-board-id/cards -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## How to Get Supabase JWKS URL

1. Go to your Supabase project dashboard
2. Note your **Project URL**: `https://your-project-ref.supabase.co`
3. **JWKS URL** is: `https://your-project-ref.supabase.co/auth/v1/jwks`

Example:
- Project URL: `https://abcdefghijklmnop.supabase.co`
- JWKS URL: `https://abcdefghijklmnop.supabase.co/auth/v1/jwks`

## Next Steps (Milestone 1)

1. **Implement card creation SQL**:
   - Insert into `boards.cards(board_id, author_id, content, lane_id?, priority?, position?)`
   - Return inserted card with ID

2. **Publish realtime event**:
   - After successful insert: `realtimeService.publish('room:board:{boardId}', 'card:created', payload)`
   - Payload: `{ cardId, boardId, content, authorId }`

3. **Implement GET /boards/:id/cards**:
   - Query: `SELECT * FROM boards.cards WHERE board_id = $1 AND lane_id = $2 AND archived_at IS NULL ORDER BY position, created_at`
   - Support `?laneId=...` query param

4. **Add DTOs**:
   - `CreateCardDto` with class-validator decorators
   - `CardResponseDto` for output

5. **Add tests**:
   - 1–2 unit tests for service methods (mock PgService)

## Code Style Compliance

✅ English identifiers  
✅ Strict types, no `any`  
✅ One export per file  
✅ JSDoc on public classes  
✅ DTOs with class-validator (ready for Milestone 1)  
✅ Controllers thin, business logic in services  
✅ Domain free of framework (services use PgService, not direct imports)  

## Architecture Alignment

✅ **Modular**: Clear module boundaries (core, shared, auth, realtime, health, boards)  
✅ **Hexagonal hints**: PgService is an infrastructure adapter; services are application layer  
✅ **CQRS-ready**: Separate command/query methods (will be explicit in Milestone 1)  
✅ **Event-Driven**: RealtimeService ready to publish domain events  
✅ **SOLID**: Single responsibility, dependency injection, interface segregation  

---

**Status**: Milestone 0 complete. Ready for Milestone 1 (Boards minimal flow).
