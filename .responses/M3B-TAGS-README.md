# M3B - Tags Feature Implementation

## 🏗️ Arquitectura Implementada

### Patrones Aplicados
- **Microservicios**: Collab Service independiente en puerto 3012
- **EDA (Event-Driven Architecture)**: Redis Pub/Sub con EventBus
- **API Gateway**: HTTP → TCP routing + Socket.IO broadcasting
- **Observer/Pub-Sub**: Gateway suscribe a `tag:*` → emit a rooms
- **Singleton**: @Global PgModule + Redis client por proceso
- **DAO**: SQL parametrizado sin ORM

### Estilos Arquitectónicos
- **Microservicios**: Physical separation, same repo
- **Cliente-Servidor**: Gateway HTTP/WS → Collab TCP
- **Arquitectura Orientada a Eventos**: Domain events after writes

## 📋 Endpoints HTTP Implementados

### Tags Management

#### 1. Crear Tag
```bash
POST /boards/:boardId/tags
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "label": "Bug",
  "color": "#ff0000"
}

# Response 201
{
  "id": "tag-uuid",
  "boardId": "board-uuid", 
  "label": "Bug",
  "color": "#ff0000"
}
```

#### 2. Listar Tags
```bash
GET /boards/:boardId/tags
Authorization: Bearer <JWT>

# Response 200
[
  {
    "id": "tag-uuid",
    "boardId": "board-uuid",
    "label": "Bug", 
    "color": "#ff0000"
  }
]
```

#### 3. Asignar Tag a Card
```bash
POST /boards/:boardId/cards/:cardId/tags/:tagId
Authorization: Bearer <JWT>

# Response 200
{
  "assigned": true
}
```

#### 4. Desasignar Tag de Card
```bash
DELETE /boards/:boardId/cards/:cardId/tags/:tagId
Authorization: Bearer <JWT>

# Response 200
{
  "unassigned": true
}
```

## 🔄 Eventos WebSocket

### Domain Events Publicados

#### tag:created
```javascript
socket.on('tag:created', (payload) => {
  console.log('Tag created:', payload);
  // payload: { tagId, boardId, label, color }
});
```

#### tag:assigned
```javascript
socket.on('tag:assigned', (payload) => {
  console.log('Tag assigned:', payload);
  // payload: { tagId, cardId, boardId }
});
```

#### tag:unassigned
```javascript
socket.on('tag:unassigned', (payload) => {
  console.log('Tag unassigned:', payload);
  // payload: { tagId, cardId, boardId }
});
```

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000', {
  query: { boardId: 'your-board-id' }
});

// Auto-join room:board:{boardId}
// Recibe eventos tag:* automáticamente
```

## 🗄️ Contratos TCP (Internos)

### Collab Service Messages

#### tags.create
```typescript
// Gateway → Collab
{ cmd: 'tags.create', boardId, label, color? }
// Response: Tag
```

#### tags.list
```typescript
// Gateway → Collab  
{ cmd: 'tags.list', boardId }
// Response: Tag[]
```

#### tags.assign
```typescript
// Gateway → Collab
{ cmd: 'tags.assign', boardId, cardId, tagId }
// Response: { assigned: boolean }
```

#### tags.unassign
```typescript
// Gateway → Collab
{ cmd: 'tags.unassign', boardId, cardId, tagId }
// Response: { unassigned: boolean }
```

## 🧪 Testing

### Flujo de Testing Completo

#### 1. Crear Tag
```bash
curl -X POST http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"label": "Bug", "color": "#ff0000"}'

# Evento esperado: tag:created
```

#### 2. Listar Tags
```bash
curl http://localhost:3000/boards/550e8400-e29b-41d4-a716-446655440000/tags \
  -H "Authorization: Bearer YOUR_JWT"
```

#### 3. Asignar Tag
```bash
curl -X POST http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/tags/TAG_ID \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: tag:assigned
```

#### 4. Desasignar Tag
```bash
curl -X DELETE http://localhost:3000/boards/BOARD_ID/cards/CARD_ID/tags/TAG_ID \
  -H "Authorization: Bearer YOUR_JWT"

# Evento esperado: tag:unassigned
```

### Unit Tests
```bash
# Ejecutar tests de Tags
npm test -- tags.dao.spec.ts
npm test -- collab.command.service.spec.ts
```

## 🗃️ Base de Datos

### Tablas Utilizadas

#### boards.tags
```sql
CREATE TABLE boards.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards.boards(id),
  label VARCHAR(50) NOT NULL,
  color VARCHAR(7), -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, label) -- Constraint para ON CONFLICT
);
```

#### boards.card_tags (Pivot)
```sql
CREATE TABLE boards.card_tags (
  card_id UUID NOT NULL REFERENCES boards.cards(id),
  tag_id UUID NOT NULL REFERENCES boards.tags(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (card_id, tag_id) -- Constraint para ON CONFLICT
);
```

### Índices Recomendados
```sql
-- Unicidad por board + label
CREATE UNIQUE INDEX idx_tags_board_label ON boards.tags(board_id, label);

-- Pivot table PK
CREATE UNIQUE INDEX idx_card_tags_pk ON boards.card_tags(card_id, tag_id);

-- Performance queries
CREATE INDEX idx_tags_board_id ON boards.tags(board_id);
CREATE INDEX idx_card_tags_card_id ON boards.card_tags(card_id);
```

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

#### Collab Service
- `apps/collab-service/src/tags/tags.dao.ts` - DAO con SQL parametrizado
- `apps/collab-service/src/collab.query.service.ts` - Query service
- `apps/collab-service/src/collab.command.service.ts` - Command + Events
- `apps/collab-service/src/collab.controller.ts` - TCP @MessagePattern
- `apps/collab-service/src/collab.module.ts` - Module registration

#### API Gateway
- `apps/api-gateway/src/http/tags.controller.ts` - HTTP endpoints
- `apps/api-gateway/src/app.module.ts` - Controller registration

#### Shared Libraries
- `libs/lib-contracts/src/tags/create-tag.dto.ts` - DTO validation
- `libs/lib-contracts/src/index.ts` - Export DTO

#### Tests
- `apps/collab-service/src/tags/tags.dao.spec.ts` - DAO unit tests
- `apps/collab-service/src/collab.command.service.spec.ts` - Command tests

### Características Técnicas

#### DAO Pattern
- SQL parametrizado con template literals
- ON CONFLICT para idempotencia
- Type-safe interfaces para rows
- Sin ORM, control total sobre queries

#### EDA Implementation
- EventBus port + Redis adapter
- Domain events después del write exitoso
- Meta.boardId para routing a rooms
- Meta.occurredAt para timestamp

#### Validation
- DTOs con class-validator
- @IsString, @Length, @IsHexColor
- Validation pipes en Gateway

#### Error Handling
- TCP exceptions propagadas a HTTP
- Status codes correctos (201/200)
- Idempotent operations

## 🚀 Deployment

### Servicios Requeridos
```bash
# 1. Redis (EventBus)
redis-server

# 2. PostgreSQL (con esquema)
# Ejecutar migrations de boards.tags y boards.card_tags

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
- [x] Endpoints HTTP operativos con DTOs
- [x] Status codes correctos (201/200)
- [x] Eventos `tag:*` por WebSocket
- [x] Idempotencia en assign/unassign
- [x] Unicidad por (board_id, label)

### ✅ Arquitectura
- [x] Microservicios pattern mantenido
- [x] EDA con Redis Pub/Sub
- [x] Gateway routing sin lógica de negocio
- [x] DAO pattern con SQL parametrizado
- [x] TypeScript estricto sin any

### ✅ Testing
- [x] Unit tests para DAO (happy path)
- [x] Unit tests para Command Service
- [x] EventBus mocking
- [x] Contratos TCP verificados

---

**Feature Tags implementada siguiendo arquitectura de microservicios con EDA** ✅
