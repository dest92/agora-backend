# Deploy en Railway - Agora Backend

Esta guía te ayudará a desplegar el monorepo de microservicios de Agora en Railway.

## Arquitectura del Deploy

El proyecto se desplegará como **5 servicios separados** en Railway:
- **API Gateway** (puerto 3000) - Punto de entrada principal
- **Boards Service** (puerto 3011) - Gestión de tableros y tarjetas
- **Collab Service** (puerto 3012) - WebSockets para colaboración en tiempo real
- **Sessions Service** (puerto 3013) - Gestión de sesiones de usuario
- **Notifications Service** (puerto 3014) - Sistema de notificaciones

## Requisitos Previos

1. Cuenta en [Railway](https://railway.app)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Cuenta en Supabase (para autenticación y base de datos)

## Paso 1: Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git y haz push de los cambios:

```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

## Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway y selecciona tu repositorio `agora-backend`

## Paso 3: Configurar Redis

Railway necesita Redis para el EventBus y Socket.IO:

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add Redis"**
3. Railway creará automáticamente la variable `REDIS_URL`

## Paso 4: Configurar PostgreSQL (Opcional)

Si no usas Supabase para la base de datos:

1. Click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creará automáticamente `DATABASE_URL`

Si usas Supabase, configura `DATABASE_URL` manualmente en el paso siguiente.

## Paso 5: Crear los 5 Servicios

Deberás crear **5 servicios separados**, uno para cada microservicio:

### 5.1 API Gateway

1. En tu proyecto, el primer servicio ya está creado
2. Click en el servicio → **"Settings"**
3. En **"Service Name"**, renombra a `api-gateway`
4. En **"Build"** → **"Start Command"**, configura:
   ```
   npm run start:prod:gateway
   ```
5. En **"Networking"** → **"Public Networking"**, habilita y configura:
   - **Port**: `3000`
   - Copia la URL pública (ej: `https://api-gateway-production.up.railway.app`)

### 5.2 Boards Service

1. Click en **"+ New"** → **"GitHub Repo"** → Selecciona el mismo repo
2. Renombra el servicio a `boards-service`
3. En **"Start Command"**:
   ```
   npm run start:prod:boards
   ```
4. En **"Networking"**, habilita puerto interno `3011`
5. **NO** habilites dominio público (solo interno)

### 5.3 Collab Service

1. Repite el proceso: **"+ New"** → **"GitHub Repo"**
2. Renombra a `collab-service`
3. **Start Command**:
   ```
   npm run start:prod:collab
   ```
4. Puerto interno: `3012`
5. **SÍ** habilita dominio público (necesario para WebSockets)

### 5.4 Sessions Service

1. **"+ New"** → **"GitHub Repo"**
2. Renombra a `sessions-service`
3. **Start Command**:
   ```
   npm run start:prod:sessions
   ```
4. Puerto interno: `3013`
5. Sin dominio público

### 5.5 Notifications Service

1. **"+ New"** → **"GitHub Repo"**
2. Renombra a `notifications-service`
3. **Start Command**:
   ```
   npm run start:prod:notifications
   ```
4. Puerto interno: `3014`
5. Sin dominio público

## Paso 6: Configurar Variables de Entorno

Cada servicio necesita las mismas variables de entorno. Railway permite crear **"Shared Variables"** para evitar duplicación.

### 6.1 Variables Compartidas

En tu proyecto, click en **"Variables"** (en el menú lateral) y agrega:

```bash
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_JWKS_URL=https://tu-proyecto.supabase.co/auth/v1/jwks
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key

# Database (desde Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.tu-proyecto.supabase.co:5432/postgres

# Redis (Railway lo crea automáticamente)
# REDIS_URL ya está configurado por Railway

# JWT
JWT_AUDIENCE=authenticated
JWT_ISSUER=https://tu-proyecto.supabase.co/auth/v1

# Environment
NODE_ENV=production

# CORS (URL de tu frontend)
SOCKET_CORS_ORIGIN=https://tu-frontend.vercel.app
```

### 6.2 Variables Específicas por Servicio

Cada servicio necesita saber su propio puerto y las URLs de los otros servicios:

#### API Gateway
```bash
GATEWAY_PORT=3000
BOARDS_SERVICE_URL=http://boards-service.railway.internal:3011
COLLAB_SERVICE_URL=http://collab-service.railway.internal:3012
SESSIONS_SERVICE_URL=http://sessions-service.railway.internal:3013
NOTIFICATIONS_SERVICE_URL=http://notifications-service.railway.internal:3014
```

#### Boards Service
```bash
BOARDS_PORT=3011
```

#### Collab Service
```bash
COLLAB_PORT=3012
```

#### Sessions Service
```bash
SESSIONS_PORT=3013
```

#### Notifications Service
```bash
NOTIFICATIONS_PORT=3014
```

## Paso 7: Configurar Networking Interno

Railway usa **Private Networking** para comunicación entre servicios:

1. Los servicios se comunican usando: `http://[service-name].railway.internal:[port]`
2. Solo `api-gateway` y `collab-service` necesitan dominios públicos
3. Los demás servicios solo son accesibles internamente

## Paso 8: Deploy

1. Railway detectará automáticamente los cambios en tu repo
2. Cada push a `main` disparará un nuevo deploy
3. Monitorea los logs en cada servicio para verificar que inician correctamente

## Paso 9: Verificar el Deploy

### 9.1 Health Check

Prueba el endpoint de salud del API Gateway:

```bash
curl https://tu-api-gateway.up.railway.app/health
```

Deberías recibir:
```json
{"status":"ok"}
```

### 9.2 Verificar Servicios

Revisa los logs de cada servicio en Railway:
- ✅ Todos los servicios deben mostrar: `Application is running on port XXXX`
- ✅ No debe haber errores de conexión a Redis
- ✅ No debe haber errores de conexión a PostgreSQL

### 9.3 Probar con Bruno

Actualiza tu colección de Bruno:

1. En `environments/production.bru`:
   ```
   BASE_URL = "https://tu-api-gateway.up.railway.app"
   ```

2. Ejecuta los tests de salud y autenticación

## Troubleshooting

### Error: "Cannot connect to Redis"

- Verifica que `REDIS_URL` esté configurado en todos los servicios
- Railway debe tener el formato: `redis://default:[PASSWORD]@[HOST]:[PORT]`

### Error: "Port already in use"

- Cada servicio debe tener su propio puerto configurado
- Verifica las variables `*_PORT` en cada servicio

### Error: "Service not found" (comunicación entre servicios)

- Usa el formato: `http://[service-name].railway.internal:[port]`
- Ejemplo: `http://boards-service.railway.internal:3011`

### WebSockets no funcionan

- Asegúrate de que `collab-service` tenga dominio público habilitado
- Verifica `SOCKET_CORS_ORIGIN` incluya tu frontend

### Build falla

- Verifica que `npm run build:all` funcione localmente
- Revisa los logs de build en Railway
- Asegúrate de que `engines` en `package.json` coincida con la versión de Node en Railway

## Monitoreo y Logs

Railway provee:
- **Logs en tiempo real** para cada servicio
- **Métricas** de CPU, memoria y red
- **Alertas** (configurable)

Para ver logs:
1. Click en un servicio
2. Tab **"Deployments"**
3. Click en el deployment activo
4. Tab **"Logs"**

## Costos Estimados

Railway ofrece:
- **$5 USD de crédito gratis** al mes
- **Hobby Plan**: $5/mes por servicio después del crédito
- **Pro Plan**: $20/mes (incluye más recursos)

Para este proyecto (5 servicios + Redis + PostgreSQL):
- **Desarrollo**: Gratis con el crédito mensual
- **Producción**: ~$20-30/mes (dependiendo del tráfico)

## Próximos Pasos

1. **Configurar CI/CD**: Railway ya hace deploy automático en cada push
2. **Configurar dominios custom**: Puedes usar tu propio dominio
3. **Configurar staging**: Crea un branch `staging` y un proyecto separado
4. **Monitoreo avanzado**: Integra con Sentry o LogRocket
5. **Backups**: Configura backups automáticos de PostgreSQL

## Recursos

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Supabase Docs](https://supabase.com/docs)

---

**¿Problemas?** Revisa los logs de cada servicio en Railway o contacta al equipo.
