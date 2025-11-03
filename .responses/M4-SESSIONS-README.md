# M4 - Sessions/Workspaces & Presence Implementation

## 🏗️ Arquitectura Implementada

### Patrones Aplicados
- **Microservicios**: Sessions Service independiente en puerto 3013
- **EDA (Event-Driven Architecture)**: Redis Pub/Sub con EventBus
- **API Gateway**: HTTP → TCP routing + Socket.IO broadcasting
- **Observer/Pub-Sub**: Gateway suscribe a `workspace:*` y `session:*` → emit a rooms
- **Singleton**: @Global PgModule + Redis client por proceso
- **DAO**: SQL parametrizado sin ORM
- **CQRS light**: Command/Query split en servicios

### Estilos Arquitectónicos
- **Microservicios**: Physical separation, same repo
- **Cliente-Servidor**: Gateway HTTP/WS → Sessions TCP
- **Arquitectura Orientada a Eventos**: Domain events after writes

## 📋 Endpoints HTTP Implementados

### Workspaces Management

#### 1. Crear Workspace
```bash
POST /workspaces
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "name": "My Workspace"
}

# Response 201
{
  "id": "workspace-uuid",
  "ownerId": "user-uuid",
  "name": "My Workspace",
  "createdAt": "2024-11-03T18:30:00.000Z"
}
```

#### 2. Listar Workspaces
```bash
GET /workspaces
Authorization: Bearer <JWT>

# Response 200
[
  {
    "id": "workspace-uuid",
    "ownerId": "user-uuid",
    "name": "My Workspace",
    "createdAt": "2024-11-03T18:30:00.000Z"
  }
]
```

### Sessions Management

#### 3. Crear Sesión
```bash
POST /workspaces/:workspaceId/sessions
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "title": "Planning Session"
}

# Response 201
{
  "id": "session-uuid",
  "workspaceId": "workspace-uuid",
  "title": "Planning Session",
  "createdAt": "2024-11-03T18:35:00.000Z"
}
```

#### 4. Unirse a Sesión
```bash
POST /sessions/:sessionId/join
Authorization: Bearer <JWT>

# Response 200
{
  "joined": true
}
```

#### 5. Salir de Sesión
```bash
POST /sessions/:sessionId/leave
Authorization: Bearer <JWT>

# Response 200
{
  "left": true
}
```

#### 6. Obtener Presence
```bash
GET /sessions/:sessionId/presence
Authorization: Bearer <JWT>

# Response 200
{
  "users": ["user-uuid-1", "user-uuid-2"]
}
```

## 🔄 Eventos WebSocket

### Domain Events Publicados

#### workspace:created
```javascript
socket.on('workspace:created', (payload) => {
  console.log('Workspace created:', payload);
  // payload: { workspaceId, ownerId, name }
});
```

#### session:created
```javascript
socket.on('session:created', (payload) => {
  console.log('Session created:', payload);
  // payload: { sessionId, workspaceId, title }
});
```

#### session:user_joined
```javascript
socket.on('session:user_joined', (payload) => {
  console.log('User joined session:', payload);
  // payload: { sessionId, userId, workspaceId }
});
```

#### session:user_left
```javascript
socket.on('session:user_left', (payload) => {
  console.log('User left session:', payload);
  // payload: { sessionId, userId, workspaceId }
});
```

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000', {
  query: { 
    workspaceId: 'your-workspace-id',
    sessionId: 'your-session-id' // opcional
  }
});

// Auto-join rooms:
// - room:workspace:{workspaceId}
// - room:session:{sessionId} (si se proporciona)
```

## 🗄️ Contratos TCP (Internos)

### Sessions Service Messages

#### workspaces.create
```typescript
// Gateway → Sessions
{ cmd: 'workspaces.create', ownerId, name }
// Response: Workspace
```

#### workspaces.list
```typescript
// Gateway → Sessions
{ cmd: 'workspaces.list', userId }
// Response: Workspace[]
```

#### sessions.create
```typescript
// Gateway → Sessions
{ cmd: 'sessions.create', workspaceId, title }
// Response: Session
```

#### sessions.join
```typescript
// Gateway → Sessions
{ cmd: 'sessions.join', sessionId, userId, workspaceId? }
// Response: { joined: boolean }
```

#### sessions.leave
```typescript
// Gateway → Sessions
{ cmd: 'sessions.leave', sessionId, userId, workspaceId? }
// Response: { left: boolean }
```

#### sessions.presence
```typescript
// Gateway → Sessions
{ cmd: 'sessions.presence', sessionId }
// Response: { users: string[] }
```

## 🧪 Testing

### Flujo de Testing Completo

#### 1. Crear Workspace
```bash
curl -X POST http://localhost:3000/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"name": "My Workspace"}'

# Evento esperado: workspace:created
```

#### 2. Listar Workspaces
```bash
curl http://localhost:3000/workspaces \
  -H "Authorization: Bearer YOUR_JWT"
```

#### 3. Crear Sesión
```bash
curl -X POST http://localhost:3000/workspaces/WORKSPACE_ID/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"title": "Planning Session"}'

# Evento esperado: session:created
```

#### 4. Unirse a Sesión
```bash
curl -X POST http://localhost:3000/sessions/SESSION_ID/join \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: session:user_joined
```

#### 5. Obtener Presence
```bash
curl http://localhost:3000/sessions/SESSION_ID/presence \
  -H "Authorization: Bearer YOUR_JWT"
```

#### 6. Salir de Sesión
```bash
curl -X POST http://localhost:3000/sessions/SESSION_ID/leave \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: session:user_left
```

## 🗃️ Base de Datos

### Tablas Utilizadas

#### boards.workspaces
```sql
CREATE TABLE boards.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### sessions.sessions
```sql
CREATE TABLE sessions.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES boards.workspaces(id),
  title VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### sessions.session_participants (Pivot)
```sql
CREATE TABLE sessions.session_participants (
  session_id UUID NOT NULL REFERENCES sessions.sessions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id) -- PK compuesta para ON CONFLICT
);
```

### Índices Recomendados
```sql
-- Performance queries por owner
CREATE INDEX idx_workspaces_owner ON boards.workspaces(owner_id);

-- Performance queries por workspace
CREATE INDEX idx_sessions_workspace ON sessions.sessions(workspace_id);

-- Performance queries por sesión
CREATE INDEX idx_participants_session ON sessions.session_participants(session_id);

-- Performance queries por usuario
CREATE INDEX idx_participants_user ON sessions.session_participants(user_id);
```

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

#### Sessions Service
- `apps/sessions-service/src/workspaces/workspaces.dao.ts` - DAO para workspaces
- `apps/sessions-service/src/sessions/sessions.dao.ts` - DAO para sessions y participants
- `apps/sessions-service/src/sessions.command.service.ts` - Command + Domain Events
- `apps/sessions-service/src/sessions.query.service.ts` - Query service (CQRS)
- `apps/sessions-service/src/sessions.controller.ts` - TCP @MessagePattern handlers
- `apps/sessions-service/src/sessions.module.ts` - Module registration
- `apps/sessions-service/src/main.ts` - TCP microservice setup

#### API Gateway
- `apps/api-gateway/src/http/workspaces.controller.ts` - HTTP workspaces endpoints
- `apps/api-gateway/src/http/sessions.controller.ts` - HTTP sessions endpoints
- `apps/api-gateway/src/app.module.ts` - Sessions Service TCP client + controllers
- `apps/api-gateway/src/socket/socket.gateway.ts` - Suscripción a workspace:* y session:*

#### Shared Libraries
- `libs/lib-contracts/src/workspaces/create-workspace.dto.ts` - DTO validation
- `libs/lib-contracts/src/sessions/create-session.dto.ts` - DTO validation
- `libs/lib-contracts/src/index.ts` - Export DTOs

#### Bruno Collection
- `agora-backend/Workspaces - Create Workspace.bru`
- `agora-backend/Workspaces - List Workspaces.bru`
- `agora-backend/Sessions - Create Session.bru`
- `agora-backend/Sessions - Join Session.bru`
- `agora-backend/Sessions - Leave Session.bru`
- `agora-backend/Sessions - Get Presence.bru`

### Características Técnicas

#### DAO Pattern
- SQL parametrizado con template literals
- ON CONFLICT DO NOTHING para idempotencia en join
- RETURNING clause para confirmar operaciones
- PK compuesta (session_id, user_id) para unicidad

#### CQRS Light
- Command Service: writes + domain events
- Query Service: optimized reads
- Separación clara de responsabilidades

#### EDA Implementation
- EventBus port + Redis adapter
- Domain events después del write exitoso
- Solo publica evento si realmente cambió algo (idempotencia)
- Meta.workspaceId para routing a workspace rooms

#### Validation
- DTOs con class-validator (@IsString, @Length)
- ParseUUIDPipe para validar UUIDs en params
- AuthGuard para proteger todos los endpoints

#### Presence System
- Basado en DB por ahora (sessions.session_participants)
- Escalable a Redis SETs en el futuro
- Presence endpoint para obtener usuarios activos

## 🚀 Deployment

### Servicios Requeridos
```bash
# 1. Redis (EventBus)
redis-server

# 2. PostgreSQL (con esquemas)
# Ejecutar migrations de boards.workspaces, sessions.sessions, sessions.session_participants

# 3. Microservicios
npm run dev:all
# - Gateway: 3000 (HTTP + WS)
# - Sessions: 3013 (TCP)
```

### Variables de Entorno
```env
# Redis EventBus
REDIS_HOST=localhost
REDIS_PORT=6379

# Sessions Service
SESSIONS_PORT=3013

# Database
DATABASE_URL=postgresql://...
```

## ✅ Criterios de Aceptación

### ✅ Funcionalidad
- [x] Endpoints HTTP operativos con DTOs validados
- [x] Status codes correctos (201/200)
- [x] Eventos `workspace:*` y `session:*` por WebSocket
- [x] Idempotencia en join/leave (ON CONFLICT DO NOTHING)
- [x] PK compuesta (session_id, user_id) para unicidad
- [x] Presence GET refleja estado de participants

### ✅ Arquitectura
- [x] Microservicios pattern mantenido
- [x] EDA con Redis Pub/Sub
- [x] Gateway routing sin lógica de negocio
- [x] DAO pattern con SQL parametrizado
- [x] CQRS light implementado
- [x] TypeScript estricto sin any

### ✅ Testing
- [x] Build exitoso: `npm run build` ✅
- [x] Bruno collection completa para testing manual
- [x] Contratos TCP verificados
- [x] Socket Gateway suscrito a workspace:* y session:*

## 🔄 Flujo Completo de Uso

### Escenario: Crear Workspace → Sesión → Join/Leave

#### 1. Setup WebSocket (Cliente)
```javascript
const socket = io('http://localhost:3000', {
  query: { workspaceId: 'your-workspace-id' }
});

socket.on('workspace:created', (data) => {
  console.log(`Workspace ${data.workspaceId} created by ${data.ownerId}`);
  // Actualizar UI: agregar workspace a lista
});

socket.on('session:created', (data) => {
  console.log(`Session ${data.sessionId} created in workspace ${data.workspaceId}`);
  // Actualizar UI: agregar sesión a workspace
});

socket.on('session:user_joined', (data) => {
  console.log(`User ${data.userId} joined session ${data.sessionId}`);
  // Actualizar UI: agregar usuario a lista de participantes
});

socket.on('session:user_left', (data) => {
  console.log(`User ${data.userId} left session ${data.sessionId}`);
  // Actualizar UI: remover usuario de lista de participantes
});
```

#### 2. Crear Workspace (HTTP)
```bash
curl -X POST http://localhost:3000/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"name": "Team Alpha Workspace"}'

# → Respuesta: { "id": "ws-123", "ownerId": "user-456", "name": "Team Alpha Workspace", ... }
# → Evento WS: workspace:created { workspaceId, ownerId, name }
```

#### 3. Crear Sesión (HTTP)
```bash
curl -X POST http://localhost:3000/workspaces/ws-123/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"title": "Sprint Planning"}'

# → Respuesta: { "id": "session-789", "workspaceId": "ws-123", "title": "Sprint Planning", ... }
# → Evento WS: session:created { sessionId, workspaceId, title }
```

#### 4. Unirse a Sesión (HTTP)
```bash
curl -X POST http://localhost:3000/sessions/session-789/join \
  -H "Authorization: Bearer JWT_TOKEN"

# → Respuesta: { "joined": true }
# → Evento WS: session:user_joined { sessionId, userId, workspaceId }
```

#### 5. Verificar Presence (HTTP)
```bash
curl http://localhost:3000/sessions/session-789/presence \
  -H "Authorization: Bearer JWT_TOKEN"

# → Respuesta: { "users": ["user-456", "user-789"] }
```

## 🎯 Casos de Uso Típicos

### Frontend Integration
```typescript
// Crear workspace y sesión
async function createWorkspaceAndSession() {
  // 1. Crear workspace
  const workspace = await fetch('/workspaces', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ name: 'My Team Workspace' })
  }).then(r => r.json());

  // 2. Crear sesión en el workspace
  const session = await fetch(`/workspaces/${workspace.id}/sessions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ title: 'Daily Standup' })
  }).then(r => r.json());

  // 3. Unirse automáticamente
  await fetch(`/sessions/${session.id}/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return { workspace, session };
}

// Monitorear presence en tiempo real
function setupPresenceMonitoring(sessionId) {
  const socket = io('http://localhost:3000', {
    query: { sessionId }
  });

  socket.on('session:user_joined', ({ userId }) => {
    updateParticipantsList(userId, 'joined');
  });

  socket.on('session:user_left', ({ userId }) => {
    updateParticipantsList(userId, 'left');
  });

  // Obtener presence inicial
  fetch(`/sessions/${sessionId}/presence`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(({ users }) => {
    initializeParticipantsList(users);
  });
}
```

### Idempotencia y Robustez
```bash
# Join múltiples veces → siempre retorna { joined: true }
# Pero solo publica evento la primera vez (cuando realmente se inserta)

curl -X POST .../sessions/SESSION_ID/join  # Primera vez: evento session:user_joined
curl -X POST .../sessions/SESSION_ID/join  # Segunda vez: sin evento (ya existe)
curl -X POST .../sessions/SESSION_ID/join  # Tercera vez: sin evento (ya existe)

# Leave de usuario que no está en sesión → retorna { left: true }
# Pero no publica evento (no había nada que remover)
```

---

**Feature Sessions/Workspaces & Presence implementada siguiendo arquitectura de microservicios con EDA y CQRS** ✅
