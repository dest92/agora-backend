# M3C - Assignees Feature Implementation

## 🏗️ Arquitectura Implementada

### Patrones Aplicados
- **Microservicios**: Collab Service independiente en puerto 3012
- **EDA (Event-Driven Architecture)**: Redis Pub/Sub con EventBus
- **API Gateway**: HTTP → TCP routing + Socket.IO broadcasting
- **Observer/Pub-Sub**: Gateway suscribe a `assignee:*` → emit a rooms
- **Singleton**: @Global PgModule + Redis client por proceso
- **DAO**: SQL parametrizado sin ORM

### Estilos Arquitectónicos
- **Microservicios**: Physical separation, same repo
- **Cliente-Servidor**: Gateway HTTP/WS → Collab TCP
- **Arquitectura Orientada a Eventos**: Domain events after writes

## 📋 Endpoints HTTP Implementados

### Assignees Management

#### 1. Asignar Usuario a Card
```bash
POST /boards/:boardId/cards/:cardId/assignees/:userId
Authorization: Bearer <JWT>

# Response 200
{
  "assigned": true
}
```

#### 2. Desasignar Usuario de Card
```bash
DELETE /boards/:boardId/cards/:cardId/assignees/:userId
Authorization: Bearer <JWT>

# Response 200
{
  "removed": true
}
```

## 🔄 Eventos WebSocket

### Domain Events Publicados

#### assignee:added
```javascript
socket.on('assignee:added', (payload) => {
  console.log('Assignee added:', payload);
  // payload: { cardId, userId, boardId }
});
```

#### assignee:removed
```javascript
socket.on('assignee:removed', (payload) => {
  console.log('Assignee removed:', payload);
  // payload: { cardId, userId, boardId }
});
```

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000', {
  query: { boardId: 'your-board-id' }
});

// Auto-join room:board:{boardId}
// Recibe eventos assignee:* automáticamente
```

## 🗄️ Contratos TCP (Internos)

### Collab Service Messages

#### assignees.add
```typescript
// Gateway → Collab
{ cmd: 'assignees.add', boardId, cardId, userId }
// Response: { assigned: boolean }
```

#### assignees.remove
```typescript
// Gateway → Collab  
{ cmd: 'assignees.remove', boardId, cardId, userId }
// Response: { removed: boolean }
```

## 🧪 Testing

### Flujo de Testing Completo

#### 1. Asignar Usuario
```bash
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: assignee:added
```

#### 2. Desasignar Usuario
```bash
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: assignee:removed
```

### Ejemplos con UUIDs
```bash
# Variables de ejemplo
BOARD_ID="550e8400-e29b-41d4-a716-446655440000"
CARD_ID="660e8400-e29b-41d4-a716-446655440001"  
USER_ID="770e8400-e29b-41d4-a716-446655440002"

# Asignar
curl -X POST http://localhost:3000/boards/$BOARD_ID/cards/$CARD_ID/assignees/$USER_ID \
  -H "Authorization: Bearer $JWT_TOKEN"

# Desasignar
curl -X DELETE http://localhost:3000/boards/$BOARD_ID/cards/$CARD_ID/assignees/$USER_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 🗃️ Base de Datos

### Tabla Utilizada

#### boards.card_assignees (Pivot)
```sql
CREATE TABLE boards.card_assignees (
  card_id UUID NOT NULL REFERENCES boards.cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (card_id, user_id) -- PK compuesta para ON CONFLICT
);
```

### Índices Recomendados
```sql
-- PK compuesta automática
CREATE UNIQUE INDEX idx_card_assignees_pk ON boards.card_assignees(card_id, user_id);

-- Performance queries por usuario
CREATE INDEX idx_card_assignees_user_id ON boards.card_assignees(user_id);

-- Performance queries por card
CREATE INDEX idx_card_assignees_card_id ON boards.card_assignees(card_id);
```

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

#### Collab Service
- `apps/collab-service/src/assignees/assignees.dao.ts` - DAO con SQL parametrizado
- `apps/collab-service/src/collab.command.service.ts` - Métodos assigneeAdd/Remove + Events
- `apps/collab-service/src/collab.controller.ts` - TCP @MessagePattern handlers
- `apps/collab-service/src/collab.module.ts` - AssigneesDao registration

#### API Gateway
- `apps/api-gateway/src/http/assignees.controller.ts` - HTTP endpoints
- `apps/api-gateway/src/app.module.ts` - Controller registration

### Características Técnicas

#### DAO Pattern
- SQL parametrizado con template literals
- ON CONFLICT DO NOTHING para idempotencia en assign
- RETURNING clause para confirmar operaciones
- PK compuesta (card_id, user_id) para unicidad

#### EDA Implementation
- EventBus port + Redis adapter
- Domain events después del write exitoso
- Solo publica evento si realmente cambió algo (idempotencia)
- Meta.boardId para routing a rooms
- Meta.occurredAt para timestamp

#### Validation
- ParseUUIDPipe para validar UUIDs en params
- AuthGuard para proteger endpoints
- No DTOs necesarios (solo params en URL)

#### Error Handling
- TCP exceptions propagadas a HTTP
- Status codes correctos (200)
- Idempotent operations (assign/remove)

## 🚀 Deployment

### Servicios Requeridos
```bash
# 1. Redis (EventBus)
redis-server

# 2. PostgreSQL (con esquema)
# Ejecutar migrations de boards.card_assignees

# 3. Microservicios
npm run dev:all
# - Gateway: 3000 (HTTP + WS)
# - Collab: 3012 (TCP)
```

### Variables de Entorno
```env
# Redis EventBus
REDIS_HOST=localhost
REDIS_PORT=6379

# Collab Service
COLLAB_PORT=3012

# Database
DATABASE_URL=postgresql://...
```

## ✅ Criterios de Aceptación

### ✅ Funcionalidad
- [x] Endpoints HTTP operativos con validación UUID
- [x] Status codes correctos (200)
- [x] Eventos `assignee:*` por WebSocket
- [x] Idempotencia en assign/remove
- [x] PK compuesta (card_id, user_id)

### ✅ Arquitectura
- [x] Microservicios pattern mantenido
- [x] EDA con Redis Pub/Sub
- [x] Gateway routing sin lógica de negocio
- [x] DAO pattern con SQL parametrizado
- [x] TypeScript estricto sin any

### ✅ Testing
- [x] Build exitoso
- [x] Tests existentes pasando
- [x] Contratos TCP verificados
- [x] Socket Gateway suscrito a assignee:*

## 🔄 Flujo Completo de Uso

### Escenario: Asignar y Desasignar Usuario

#### 1. Setup WebSocket (Cliente)
```javascript
const socket = io('http://localhost:3000', {
  query: { boardId: 'your-board-id' }
});

socket.on('assignee:added', (data) => {
  console.log(`Usuario ${data.userId} asignado a card ${data.cardId}`);
  // Actualizar UI: agregar avatar del usuario a la card
});

socket.on('assignee:removed', (data) => {
  console.log(`Usuario ${data.userId} desasignado de card ${data.cardId}`);
  // Actualizar UI: remover avatar del usuario de la card
});
```

#### 2. Asignar Usuario (HTTP)
```bash
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer JWT_TOKEN"

# → Respuesta: { "assigned": true }
# → Evento WS: assignee:added { cardId, userId, boardId }
```

#### 3. Desasignar Usuario (HTTP)
```bash
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/assignees/USER_ID \
  -H "Authorization: Bearer JWT_TOKEN"

# → Respuesta: { "removed": true }  
# → Evento WS: assignee:removed { cardId, userId, boardId }
```

## 🎯 Casos de Uso Típicos

### Frontend Integration
```typescript
// Asignar usuario actual a una card
async function assignMeToCard(cardId: string) {
  const response = await fetch(`/boards/${boardId}/cards/${cardId}/assignees/${currentUserId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    // El evento assignee:added llegará por WebSocket automáticamente
    console.log('Asignado exitosamente');
  }
}

// Desasignar usuario de una card
async function unassignUserFromCard(cardId: string, userId: string) {
  const response = await fetch(`/boards/${boardId}/cards/${cardId}/assignees/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    // El evento assignee:removed llegará por WebSocket automáticamente
    console.log('Desasignado exitosamente');
  }
}
```

### Idempotencia
```bash
# Asignar el mismo usuario múltiples veces → siempre retorna { assigned: true }
# Pero solo publica evento la primera vez (cuando realmente se inserta)

curl -X POST .../assignees/USER_ID  # Primera vez: evento assignee:added
curl -X POST .../assignees/USER_ID  # Segunda vez: sin evento (ya existe)
curl -X POST .../assignees/USER_ID  # Tercera vez: sin evento (ya existe)

# Desasignar usuario que no está asignado → retorna { removed: true }
# Pero no publica evento (no había nada que remover)
```

---

**Feature Assignees implementada siguiendo arquitectura de microservicios con EDA** ✅
