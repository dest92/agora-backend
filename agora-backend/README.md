# Agora Backend - Bruno API Collection

Esta colección de Bruno contiene todos los endpoints implementados en la arquitectura de microservicios de Agora Backend.

## 🚀 Setup Rápido

### 1. Configurar Variables
```bash
# Copiar archivo de ejemplo
cp environments/example.bru environments/dev.bru
```

### 2. Obtener JWT Token
1. Ve a tu aplicación Supabase
2. Autentica un usuario
3. Copia el JWT token del localStorage o developer tools
4. Pégalo en `environments/dev.bru` en la variable `JWT_TOKEN`

### 3. Configurar Board ID
1. Asegúrate de tener un board creado en tu base de datos
2. Copia el UUID del board
3. Pégalo en `environments/dev.bru` en la variable `BOARD_ID`

## 🏗️ Arquitectura de Puertos

### URLs Configuradas
- **GATEWAY_URL**: `http://localhost:3000` - API Gateway (punto de entrada único)
- **BOARDS_URL**: `http://localhost:3011` - Boards Service (directo)
- **COLLAB_URL**: `http://localhost:3012` - Collab Service (directo)
- **SESSIONS_URL**: `http://localhost:3013` - Sessions Service (directo)
- **NOTIFICATIONS_URL**: `http://localhost:3014` - Notifications Service (directo)

## 📋 Endpoints Incluidos

### Core (M0-M1)
- ✅ **Health Check** - `GET /health` (público)
- ✅ **Create Card** - `POST /boards/:boardId/cards`
- ✅ **List Cards** - `GET /boards/:boardId/cards`

### Cards Management (M2)
- ✅ **Update Card** - `PATCH /boards/:boardId/cards/:cardId`
- ✅ **Archive Card** - `POST /boards/:boardId/cards/:cardId/archive`
- ✅ **Unarchive Card** - `POST /boards/:boardId/cards/:cardId/unarchive`
- ✅ **Refresh Projections** - `POST /boards/:boardId/projections/refresh`

### Collaboration (M3)
- ✅ **Add Comment** - `POST /boards/:boardId/cards/:cardId/comments`
- ✅ **List Comments** - `GET /boards/:boardId/cards/:cardId/comments`
- ✅ **Vote Up** - `POST /boards/:boardId/cards/:cardId/votes/up`
- ✅ **Vote Down** - `POST /boards/:boardId/cards/:cardId/votes/down`
- ✅ **Remove Vote** - `DELETE /boards/:boardId/cards/:cardId/votes`

## 🧪 Testing Flow

### Colecciones Organizadas

#### 1. **Services Health** - Verificar que todos los servicios estén funcionando
- Gateway Health (puerto 3000)
- Boards Service Health (puerto 3011)
- Collab Service Health (puerto 3012)
- Sessions Service Health (puerto 3013)
- Notifications Service Health (puerto 3014)

#### 2. **Gateway Endpoints** - Testing a través del API Gateway (recomendado)
- Health Check, Create Card, List Cards, etc.
- **Ventaja**: Simula el flujo real del frontend

#### 3. **Direct Services** - Testing directo a cada microservicio
- Boards - Direct Create Card (puerto 3011)
- Collab - Direct Add Comment (puerto 3012)
- **Ventaja**: Debugging y testing aislado de servicios

#### 4. **Comparison** - Comparar Gateway vs Direct
- Verificar que el routing funcione correctamente
- Medir overhead de routing

### Flujo Recomendado
1. **Services Health** - Verificar que todos los servicios estén UP
2. **Create Card** (via Gateway) - Crear una card (guarda CARD_ID automáticamente)
3. **Direct Create Card** (via Boards Service) - Comparar respuesta directa
4. **List Cards** - Verificar que ambas cards aparezcan
5. **Add Comment** - Agregar comentario a la card
6. **Direct Add Comment** - Probar servicio directo
7. **Vote Up/Down/Remove** - Testing completo de votación
8. **Archive/Unarchive** - Gestión de archivado

### Variables Automáticas
Los siguientes IDs se guardan automáticamente para usar en requests posteriores:
- `CARD_ID` - Se guarda al crear una card
- `COMMENT_ID` - Se guarda al crear un comentario  
- `VOTE_ID` - Se guarda al votar

## 🔧 Tests Incluidos

Cada request incluye tests automáticos que verifican:
- ✅ Status codes correctos (200, 201)
- ✅ Estructura de respuesta esperada
- ✅ Valores de campos específicos
- ✅ Guardado automático de IDs para requests posteriores

## 🌐 Real-time Events

Mientras ejecutas los requests, puedes monitorear eventos en tiempo real:

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000', {
  query: { boardId: 'tu-board-id' }
});

// Escuchar eventos
socket.on('card:created', (data) => console.log('Card created:', data));
socket.on('card:updated', (data) => console.log('Card updated:', data));
socket.on('card:archived', (data) => console.log('Card archived:', data));
socket.on('comment:added', (data) => console.log('Comment added:', data));
socket.on('vote:cast', (data) => console.log('Vote cast:', data));
socket.on('vote:removed', (data) => console.log('Vote removed:', data));
```

### Redis Monitoring
```bash
# En otra terminal
redis-cli MONITOR
```

## 🚨 Troubleshooting

### Error 401 (Unauthorized)
- Verifica que `JWT_TOKEN` esté configurado correctamente
- Asegúrate de que el token no haya expirado
- Confirma que el token sea de Supabase y tenga el formato correcto

### Error 404 (Not Found)
- Verifica que `BOARD_ID` exista en tu base de datos
- Confirma que el servidor esté ejecutándose en `http://localhost:3000`
- Asegúrate de que todos los servicios estén funcionando (`npm run dev:all`)

### Error 500 (Internal Server Error)
- Revisa los logs del servidor
- Verifica que Redis esté conectado
- Confirma que la base de datos esté accesible

## 📊 Arquitectura

Esta colección prueba la arquitectura de microservicios:
- **API Gateway** (puerto 3000) - HTTP + Socket.IO
- **Boards Service** (puerto 3011) - Gestión de cards
- **Collab Service** (puerto 3012) - Comments, votes, tags
- **Redis EventBus** - Eventos en tiempo real
- **Supabase** - Base de datos y autenticación

---

**¡Happy Testing!** 🎉
