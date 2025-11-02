# Quick Start — Agora Backend

## ✅ Status: Milestone 0 Complete

All files have been generated. Dependencies are installed. Build is successful.

## Next Steps

### 1. Update DATABASE_URL in .env

Your `.env` file has Supabase credentials, but `DATABASE_URL` needs to be updated.

**Get your connection string:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `nvyxecumnhksxkaydfxi`
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (use "Session pooler" for better performance)
5. Update line 8 in `.env`:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:6543/postgres?sslmode=require
```

### 2. Start the Development Server

```powershell
npm run start:dev
```

Expected output:
```
[Nest] INFO [Bootstrap] Application listening on port 3000
[Nest] INFO [PgService] PostgreSQL pool initialized
```

### 3. Test the Endpoints

**Health check (no auth required):**
```powershell
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T18:00:00.000Z"
}
```

**Auth test (requires JWT):**

First, get a JWT token:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Create a test user or sign in with existing user
3. Copy the access token

Then:
```powershell
curl http://localhost:3000/auth/test -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected:
```json
{
  "message": "Authentication successful",
  "user": {
    "userId": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Boards stub (requires JWT):**
```powershell
curl -X POST http://localhost:3000/boards/test-board-id/cards -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected (501 Not Implemented):
```json
{
  "statusCode": 501,
  "message": "Not implemented"
}
```

## What's Built

✅ **Environment validation** (Zod)  
✅ **PostgreSQL connection** (pg Pool with health check)  
✅ **Supabase JWT auth** (JWKS verification, RS256)  
✅ **Global AuthGuard** (with @Public decorator support)  
✅ **Realtime publisher** (Supabase Channels)  
✅ **Global exception filter** (error mapping)  
✅ **Request ID middleware**  
✅ **CORS enabled**  
✅ **Validation pipes** (class-validator)  

## File Structure

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

## Troubleshooting

**"Environment validation failed"**
→ Check all env vars in `.env` are set correctly

**"PostgreSQL health check failed"**
→ Verify `DATABASE_URL` is correct and Supabase project is running

**"JWKS fetch failed"**
→ Verify `SUPABASE_JWKS_URL` matches your project URL

**JWT verification fails**
→ Ensure token is from the same Supabase project and hasn't expired

## Next: Milestone 1

Implement the boards minimal flow:
- Card creation with SQL
- Realtime event publishing
- GET /boards/:id/cards endpoint
- DTOs with validation
- Basic unit tests

See `README-MILESTONE-0.md` for detailed documentation.
