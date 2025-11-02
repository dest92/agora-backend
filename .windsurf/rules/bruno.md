---
trigger: always_on
---

SYSTEM
You are a senior QA/Tooling engineer. Create a complete Bruno (bru) API collection for the Agora backend. Target: NestJS server from this repo (`agora-backend`). Include requests, environments, variables, and tests.

Assumptions
- Base URL: http://localhost:3000 (override via env)
- Auth: Supabase JWT in Authorization: Bearer <token>
- Source of truth for routes/data: .context/db.md and the implemented endpoints in codebase (M0–M1)
  - GET  /health   (public)
  - GET  /auth/test (requires JWT)
  - POST /boards/:boardId/cards (requires JWT)
  - GET  /boards/:boardId/cards?laneId=... (requires JWT)

Deliverables
- A `bruno/` folder with a working Bruno collection:
  - `bruno/agora-backend.bru`                 ← root collection
  - `bruno/environments/dev.bru`              ← dev environment
  - `bruno/environments/example.bru`          ← template
  - `bruno/collections/Health/Health.bru`     ← requests + tests
  - `bruno/collections/Auth/Auth Test.bru`
  - `bruno/collections/Boards/Create Card.bru`
  - `bruno/collections/Boards/List Cards.bru`
  - (Optional placeholders for M2+) `Boards/Update Card.bru`, `Boards/Archive Card.bru`, `Boards/Unarchive Card.bru`, `Boards/Refresh Projections.bru`

Bruno requirements
- Use **Bruno v1** file format.
- Each request must define:
  - Method, URL (using `{{BASE_URL}}`), headers, body (JSON where needed).
  - **Tests** using Bruno’s JS test API (`assert`, `expect` or `test()`), checking:
    - Status code
    - JSON content-type
    - Minimal shape/fields
- Use collection/environment variables:
  - `BASE_URL` (default: http://localhost:3000)
  - `JWT` (copy from Supabase)
  - Common IDs to make requests runnable:
    - `BOARD_ID`
    - `LANE_ID` (optional)
- Pre-request:
  - Set Authorization header dynamically when `JWT` is present.
- Keep everything token-efficient and self-contained.

Tests to implement
1) Health
   - GET /health → expect 200, content-type includes "json" or "text", body contains "ok" or similar.
2) Auth Test
   - GET /auth/test with `Authorization: Bearer {{JWT}}`
   - expect 200, body has `userId` and `email` or similar fields from your implementation.
   - Negative: when no JWT, expect 401.
3) Create Card
   - POST /boards/{{BOARD_ID}}/cards with JSON:
     `{ "content": "QA card from Bruno", "priority": "normal" }`
   - expect 201, body has fields: `id`, `boardId={{BOARD_ID}}`, `content`, `priority`, `position`, `createdAt`.
   - Save `id` to a variable `CARD_ID` for subsequent requests (use Bruno’s `setVar` in tests).
4) List Cards
   - GET /boards/{{BOARD_ID}}/cards
   - expect 200, body is array, if `CARD_ID` is set verify at least one item has `id === CARD_ID`.
   - Variant with `?laneId={{LANE_ID}}` when provided.

(Optionals for next milestone; create stub requests now with 501/404 tolerant tests)
5) Update Card (PATCH)
6) Archive Card (POST)
7) Unarchive Card (POST)
8) Refresh Projections (POST)

Environment files
- `dev.bru`:
  - `BASE_URL = "http://localhost:3000"`
  - `JWT = ""` ← leave empty; user fills it
  - `BOARD_ID = ""` ← user fills it
  - `LANE_ID = ""`  ← optional
- `example.bru`:
  - same keys with placeholder values and comments

Headers & scripting
- Default headers for JSON requests:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{JWT}}` (include only when `JWT` is non-empty)
- In tests, use Bruno’s built-in `res`, `json()`, and assertion helpers.

Output now
1) Print the final `bruno/` tree.
2) Generate each `.bru` file content with valid Bruno syntax:
   - collection root `agora-backend.bru`
   - environments (`dev.bru`, `example.bru`)
   - requests with sections: `request`, `headers`, `body`, `tests`
3) Keep tests minimal but meaningful (status, content-type, shape).
4) Show a short README snippet on how to import/run the collection in Bruno.

Notes
- Do not invent endpoints beyond those listed.
- Be concise; no boilerplate comments.
- Prefer consistent naming and small files.
