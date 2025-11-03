# Agora Backend - Bruno API Collection

Colección completa de Bruno para probar toda la funcionalidad del backend de Agora, desde autenticación hasta funcionalidades colaborativas.

## 🚀 Configuración Inicial

### 1. Instalar Bruno
```bash
# Descargar Bruno desde https://usebruno.com/
# O instalar via package manager
npm install -g @usebruno/cli
```

### 2. Configurar Entorno
1. Abrir Bruno y importar la colección desde la carpeta `bruno/`
2. Seleccionar el entorno `dev` 
3. Las variables ya están configuradas con valores del `.env` actual

### 3. Variables de Entorno
```
BASE_URL=http://localhost:3000
SUPABASE_URL=https://nvyxecumnhksxkaydfxi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT=                    # Se llena automáticamente tras login
USER_ID=               # Se llena automáticamente tras login
EMAIL=test@agora.dev   # Cambiar por tu email de prueba
PASSWORD=TestPassword123!  # Cambiar por tu password
WORKSPACE_ID=          # Se llena automáticamente
BOARD_ID=              # Se llena automáticamente
CARD_ID=               # Se llena automáticamente
SESSION_ID=            # Se llena automáticamente
```

## 📋 Flujo de Pruebas

### 1. Health Checks
- **Gateway Health**: Verifica que el gateway esté funcionando
- **Services Health Matrix**: Verifica todos los microservicios + Redis

### 2. Authentication
- **Register**: Crear nueva cuenta (o usar existente)
- **Login**: Autenticarse y obtener JWT
- **Test Auth**: Verificar que el JWT funciona
- **Unauthorized Test**: Verificar que endpoints protegidos requieren auth

### 3. Workspaces
- **List Workspaces**: Ver workspaces disponibles
- **Create Workspace**: Crear nuevo workspace
- **Get Workspace**: Obtener detalles del workspace

### 4. Boards & Cards
- **Create Board**: Crear tablero en workspace
- **Create Card**: Crear tarjeta en tablero
- **List Cards**: Listar todas las tarjetas
- **Update Card**: Modificar contenido de tarjeta
- **Archive/Unarchive Card**: Archivar y desarchivar
- **Refresh Projections**: Refrescar proyecciones CQRS

### 5. Sessions (Colaboración)
- **Create Session**: Crear sesión colaborativa
- **Join Session**: Unirse a sesión
- **Get Session**: Ver detalles y participantes
- **Leave Session**: Salir de sesión

### 6. Tags & Assignees
- **Create Tag**: Crear etiqueta para tablero
- **List Tags**: Ver todas las etiquetas
- **Assign User**: Asignar usuario a tarjeta
- **List Assignees**: Ver asignaciones de tarjeta

## 🔄 Orden de Ejecución Recomendado

1. **Health Checks** (verificar que todo esté funcionando)
2. **Auth/Register** o **Auth/Login** (obtener JWT)
3. **Workspaces/Create Workspace** (crear contexto)
4. **Boards/Create Board** (crear tablero)
5. **Boards/Create Card** (crear tarjeta)
6. **Sessions/Create Session** (crear sesión colaborativa)
7. Ejecutar el resto según necesidades

## ✅ Validaciones Automáticas

Cada request incluye tests que verifican:
- **Status codes** correctos
- **Content-Type** apropiado
- **Estructura de respuesta** válida
- **Datos guardados** correctamente
- **Variables de entorno** actualizadas automáticamente

## 🏗️ Arquitectura Probada

La colección valida los siguientes patrones arquitectónicos:

### API Gateway Pattern
- Único punto de entrada HTTP
- Routing a microservicios TCP
- Manejo centralizado de auth

### Microservicios
- **boards-service**: Gestión de tableros y tarjetas
- **sessions-service**: Sesiones colaborativas
- **collab-service**: Funcionalidades colaborativas
- **notifications-service**: Notificaciones

### EDA (Event-Driven Architecture)
- Redis Pub/Sub para eventos
- EventBus como backbone
- Observer pattern para WebSocket

### Auth & Security
- JWT con Supabase
- Global AuthGuard
- Endpoints públicos limitados

## 🚨 Troubleshooting

### Error 401 en requests protegidos
1. Ejecutar **Auth/Login** primero
2. Verificar que `JWT` se guardó en variables
3. Verificar que el token no expiró

### Error 404 en recursos
1. Ejecutar requests de creación primero
2. Verificar que IDs se guardaron en variables
3. Verificar que el recurso existe

### Error de conexión
1. Verificar que los servicios estén corriendo: `npm run dev:all`
2. Verificar `BASE_URL` en variables de entorno
3. Verificar que Redis esté conectado

### Variables no se guardan
1. Verificar que los tests pasen correctamente
2. Revisar la pestaña "Tests" en Bruno
3. Verificar que la respuesta tenga la estructura esperada

## 📊 Evidencia de Pruebas

Los tests generan evidencia automática de:
- ✅ **Health Matrix**: Todos los servicios funcionando
- ✅ **Auth Enforcement**: Endpoints protegidos requieren JWT
- ✅ **CRUD Operations**: Crear, leer, actualizar, archivar
- ✅ **Collaborative Features**: Sesiones y asignaciones
- ✅ **Response Times**: Latencias de API
- ✅ **Data Integrity**: Consistencia de datos

## 🔧 Comandos Útiles

```bash
# Ejecutar colección completa via CLI
bru run --env dev

# Ejecutar solo health checks
bru run --env dev --folder "Health"

# Ejecutar con output detallado
bru run --env dev --output detailed

# Generar reporte HTML
bru run --env dev --reporter html --output report.html
```

## 📝 Notas Importantes

- **Orden importa**: Algunos requests dependen de variables de requests anteriores
- **Idempotencia**: Los requests están diseñados para ser re-ejecutables
- **Cleanup**: No hay cleanup automático, los datos de prueba persisten
- **Rate Limiting**: Respetar límites de Supabase si aplican
- **Environment**: Usar `dev` para desarrollo local, crear otros entornos según necesidad

## 🎯 Casos de Uso Cubiertos

- [x] **Onboarding completo**: Registro → Login → Workspace → Board
- [x] **Flujo colaborativo**: Crear sesión → Unirse → Colaborar
- [x] **Gestión de contenido**: CRUD completo de tarjetas
- [x] **Organización**: Tags y asignaciones
- [x] **Monitoreo**: Health checks y métricas
- [x] **Seguridad**: Auth enforcement y validaciones
