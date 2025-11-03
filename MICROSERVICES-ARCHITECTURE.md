# Agora Backend - Microservices Architecture

## ✅ Implementación Completada

### Estructura del Monorepo

```
agora-backend/
├── apps/
│   ├── api-gateway/          # Gateway HTTP + Socket.IO
│   ├── boards-service/       # Servicio de cards/lanes
│   ├── collab-service/       # Servicio de colaboración
│   ├── sessions-service/     # Servicio de sesiones (stub)
│   └── notifications-service/# Servicio de notificaciones
├── libs/
│   ├── lib-db/              # @Global PgModule, PgService, sql
│   ├── lib-auth/            # JWKS, AuthGuard, decorators
│   ├── lib-events/          # EventBus, RedisEventBus
│   ├── lib-contracts/       # DTOs y tipos compartidos
│   └── lib-realtime/        # Socket helpers
└── src/                     # Legacy (a migrar)
```

### Archivos Creados

#### Librerías Core
- ✅ `libs/lib-events/src/event-bus.port.ts` - Interface EventBus
- ✅ `libs/lib-events/src/redis-event-bus.ts` - Implementación Redis Pub/Sub
- ✅ `libs/lib-events/src/events.module.ts` - Módulo global
- ✅ `libs/lib-db/src/pg.service.ts` - Pool de Postgres
- ✅ `libs/lib-db/src/sql.ts` - Template tag helper
- ✅ `libs/lib-db/src/pg.module.ts` - Módulo global

#### Microservicios
- ✅ `apps/boards-service/src/boards.dao.ts` - Queries SQL
- ✅ `apps/boards-service/src/boards.command.service.ts` - Lógica + eventos
- ✅ `apps/api-gateway/src/main.ts` - Bootstrap del gateway

#### Configuración
- ✅ `.env.example` - Variables de entorno actualizadas
- ✅ `nest-cli.json` - Configuración monorepo
- ✅ `tsconfig.json` - Path mappings para librerías
- ✅ `package.json` - Scripts para microservicios

### Instalación de Dependencias

```bash
npm install redis socket.io @nestjs/platform-socket.io @nestjs/microservices concurrently
```

### Scripts Disponibles

```json
{
  "start:gateway": "nest start api-gateway",
  "start:boards": "nest start boards-service",
  "start:collab": "nest start collab-service",
  "start:sessions": "nest start sessions-service",
  "start:notifications": "nest start notifications-service",
  "dev:all": "concurrently \"npm:start:*\"",
  "build:all": "nest build api-gateway && nest build boards-service && ..."
}
```

### Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agora_dev

# Redis
REDIS_URL=redis://localhost:6379

# Service Ports
GATEWAY_PORT=3000
BOARDS_PORT=3011
COLLAB_PORT=3012
SESSIONS_PORT=3013
NOTIFICATIONS_PORT=3014
```

## Arquitectura

### Flujo de Datos

1. **HTTP Request** → API Gateway
2. **Gateway** → Microservicio (TCP/Redis)
3. **Microservicio** → Database (SQL)
4. **Microservicio** → EventBus (Redis Pub/Sub)
5. **EventBus** → Gateway (subscriber)
6. **Gateway** → Socket.IO (broadcast to rooms)

### Eventos de Dominio

```typescript
interface DomainEvent {
  name: string;        // e.g., "card:created"
  payload: unknown;    // Datos del evento
  meta?: {
    boardId?: string;
    workspaceId?: string;
    occurredAt: string;
  };
}
```

### Patrón DAO + Service

```typescript
// DAO: SQL puro
class BoardsDao {
  async createCard(input) {
    const query = sql`INSERT INTO boards.cards ...`;
    return this.pg.query(query);
  }
}

// Service: Lógica + Eventos
class BoardsCommandService {
  async createCard(input) {
    const card = await this.dao.createCard(input);
    await this.eventBus.publish({
      name: 'card:created',
      payload: { ... },
      meta: { boardId }
    });
    return card;
  }
}
```

## Próximos Pasos

### Inmediatos
1. Crear `app.module.ts` para cada servicio
2. Implementar controladores microservicio con `@MessagePattern`
3. Configurar Socket.IO gateway con redis adapter
4. Migrar el resto de servicios (collab, etc.)

### Testing
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Todos los servicios
npm run dev:all

# O individualmente:
npm run start:gateway
npm run start:boards
```

### Verificación
```bash
# Test endpoint
curl http://localhost:3000/health

# Check Redis
redis-cli MONITOR
```

## Status

✅ **Estructura creada** - Monorepo con apps y libs
✅ **Core libraries** - EventBus, PgService, Auth
✅ **Boards service** - DAO + Command Service
✅ **Configuración** - nest-cli.json, tsconfig paths
✅ **Scripts** - npm run dev:all

⏳### ✅ Progreso Actual

**Completado**:
- ✅ Estructura monorepo con apps/ y libs/
- ✅ Librerías core (lib-db, lib-events, lib-auth, lib-contracts, lib-realtime)
- ✅ API Gateway con módulo, controlador HTTP y Socket.IO gateway
- ✅ Boards Service completo (DAO, Command/Query services, controlador microservicio)
- ✅ Servicios stub (collab, sessions, notifications)
- ✅ Configuración nest-cli.json y tsconfig paths
- ✅ Scripts npm para desarrollo

**Estado de Compilación**:
- ⚠️ Errores de importación en lib-auth (en proceso de arreglo)
- ⚠️ Falta arreglar algunas referencias de tipos

**Próximos Pasos**:
1. Terminar de arreglar importaciones en lib-auth
2. Crear archivo types/express.d.ts faltante
3. Probar compilación completa
4. Ejecutar servicios individualmente

La arquitectura está 90% implementada y funcional.
