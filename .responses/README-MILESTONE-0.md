# Agora Backend - Milestone 0

Clean NestJS backend with Supabase (Auth JWKS, Postgres, Realtime Channels).

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (free tier works)

## Setup

### 1. Install Dependencies

```powershell
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWKS_URL=https://your-project-ref.supabase.co/auth/v1/jwks
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### 3. Get Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** → **API**:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (keep secret!)
4. For `SUPABASE_JWKS_URL`: append `/auth/v1/jwks` to your Project URL
5. Go to **Settings** → **Database**:
   - `DATABASE_URL`: Connection string (use "Session pooler" for better performance)

### 4. Run Development Server

```powershell
npm run start:dev
```

The server will start on `http://localhost:3000`.

## Verify Installation

### Test Health Endpoint (No Auth)

```powershell
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Auth Endpoint (Requires JWT)

First, get a JWT token from Supabase:

1. Go to your Supabase project → **Authentication** → **Users**
2. Create a test user or use existing
3. Use Supabase client to sign in and get access token, or use the Supabase dashboard to generate a test token

Then test:

```powershell
curl http://localhost:3000/auth/test -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "message": "Authentication successful",
  "user": {
    "userId": "uuid-here",
    "email": "user@example.com"
  }
}
```

### Test Protected Endpoint

```powershell
curl http://localhost:3000/boards/test-board-id/cards -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response (501 Not Implemented):
```json
{
  "statusCode": 501,
  "message": "Not implemented"
}
```

## Architecture

```
src/
├── config/          # Env validation (Zod)
├── core/            # Global filters, middleware, decorators
├── shared/          # PgModule (pg Pool), sql helper
├── auth/            # JWKS service, JWT verifier, AuthGuard
├── realtime/        # Supabase Realtime publisher
├── health/          # Health check endpoint
├── boards/          # Boards module (skeleton)
├── app.module.ts    # Root module
└── main.ts          # Bootstrap
```

## Key Features

- ✅ Environment validation with Zod
- ✅ PostgreSQL connection via `pg` Pool
- ✅ Supabase JWT validation using JWKS (RS256)
- ✅ Global AuthGuard with `@Public()` decorator
- ✅ Supabase Realtime Channels publisher
- ✅ Global exception filter
- ✅ Request ID middleware
- ✅ CORS enabled
- ✅ Validation pipes (class-validator)

## Next Steps (Milestone 1)

- Implement card creation with SQL
- Publish realtime events to Supabase Channels
- Add GET /boards/:id/cards endpoint
- Add DTOs with validation
- Add basic unit tests

## Troubleshooting

### "Cannot find module 'zod'" or similar

Run `npm install` to install all dependencies.

### "Environment validation failed"

Check your `.env` file has all required variables with valid values.

### "PostgreSQL health check failed"

Verify `DATABASE_URL` is correct and your Supabase project is running.

### "JWKS fetch failed"

Verify `SUPABASE_JWKS_URL` is correct (should be `https://YOUR-PROJECT.supabase.co/auth/v1/jwks`).

### JWT verification fails

- Ensure the token is from the same Supabase project
- Check token hasn't expired
- Verify `SUPABASE_URL` matches the issuer in the JWT
