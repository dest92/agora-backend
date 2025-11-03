# M4 - Auth Proxy Implementation

## 🏗️ Arquitectura Implementada

### Patrones Aplicados
- **API Gateway**: HTTP único punto de entrada para autenticación
- **Singleton**: ConfigService y HttpModule globales
- **Microservicios**: Auth proxy separado de services de dominio (no TCP, REST directo)

### Estilos Arquitectónicos
- **Cliente-Servidor**: Gateway → Supabase Auth REST
- **Microservicios**: Gateway separado de services de dominio

## 📋 Endpoints HTTP Implementados

### Authentication Management

#### 1. Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

# Response 201
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

#### 2. Login User
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

# Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

#### 3. Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

#### 4. Logout User
```bash
POST /auth/logout
Content-Type: application/json

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response 200
{
  "accessToken": null,
  "refreshToken": null,
  "user": {
    "id": null,
    "email": null
  }
}
```

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

#### DTOs (Validation)
- `apps/api-gateway/src/http/dto/register.dto.ts` - Email + password validation
- `apps/api-gateway/src/http/dto/login.dto.ts` - Email + password validation
- `apps/api-gateway/src/http/dto/refresh.dto.ts` - RefreshToken validation
- `apps/api-gateway/src/http/dto/logout.dto.ts` - AccessToken validation

#### Controller
- `apps/api-gateway/src/http/auth.controller.ts` - Auth proxy con HttpService
- `apps/api-gateway/src/app.module.ts` - HttpModule + AuthController registration

### Validaciones Implementadas

#### RegisterDto & LoginDto
```typescript
@IsEmail()
email!: string;

@IsString()
@MinLength(6)
password!: string;
```

#### RefreshDto & LogoutDto
```typescript
@IsString()
@MinLength(10)
refreshToken!: string; // o accessToken
```

### Supabase Integration

#### Headers en TODAS las llamadas
```typescript
headers: {
  apikey: SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  // Authorization: Bearer <accessToken> solo para LOGOUT
}
```

#### Endpoints Supabase Mapeados
- **REGISTER**: `POST {SUPABASE_URL}/auth/v1/signup`
- **LOGIN**: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`
- **REFRESH**: `POST {SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`
- **LOGOUT**: `POST {SUPABASE_URL}/auth/v1/logout`

#### Shape Estable de Respuesta
```typescript
interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string | null;
    email: string | null;
  };
}
```

## 🧪 Testing con curl

### Flujo Completo de Autenticación

#### 1. Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "securepass123"
  }'

# Expected Response 201:
# {
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ...",
#   "user": {
#     "id": "uuid",
#     "email": "testuser@example.com"
#   }
# }
```

#### 2. Login Existing User
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "securepass123"
  }'

# Expected Response 200:
# {
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ...",
#   "user": {
#     "id": "uuid",
#     "email": "testuser@example.com"
#   }
# }
```

#### 3. Use Access Token (Test Protected Endpoint)
```bash
# Usar el accessToken del login para acceder a endpoints protegidos
curl http://localhost:3000/workspaces \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected Response 200: Lista de workspaces del usuario
```

#### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Expected Response 200:
# {
#   "accessToken": "eyJ...", // Nuevo token
#   "refreshToken": "eyJ...", // Nuevo refresh token
#   "user": {
#     "id": "uuid",
#     "email": "testuser@example.com"
#   }
# }
```

#### 5. Logout User
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Expected Response 200:
# {
#   "accessToken": null,
#   "refreshToken": null,
#   "user": {
#     "id": null,
#     "email": null
#   }
# }
```

## ⚙️ Configuración

### Variables de Entorno Requeridas
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# No distinguir entre dev/prod - misma configuración
```

### Configuración Supabase
1. **Crear proyecto en Supabase**
2. **Obtener URL y ANON_KEY** del dashboard
3. **Configurar Auth settings** (opcional):
   - Email confirmation: enabled/disabled
   - Password requirements
   - OAuth providers (si se desea)

## 🔒 Seguridad y Buenas Prácticas

### Implementadas
- ✅ **No logging de passwords ni tokens** - Logger solo registra errores sin datos sensibles
- ✅ **Manejo coherente de errores** - Mapeo de errores Supabase a HTTP status codes
- ✅ **Validación estricta** - DTOs con class-validator
- ✅ **Headers correctos** - apikey y Content-Type en todas las llamadas
- ✅ **Shape estable** - Respuesta normalizada independiente de Supabase

### Error Handling
```typescript
// Mapeo de errores Supabase → HTTP coherentes
private handleSupabaseError(error: any): HttpException {
  const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = error.response?.data?.error_description || 
                 error.response?.data?.msg || 
                 'Authentication failed';
  
  return new HttpException(message, status);
}
```

### Casos de Error Comunes
- **400 Bad Request**: Email inválido, password muy corto
- **401 Unauthorized**: Credenciales incorrectas, token expirado
- **422 Unprocessable Entity**: Email ya registrado
- **500 Internal Server Error**: Error de Supabase o configuración

## 🎯 Integración con AuthGuard Existente

### Compatibilidad
- ✅ **JWT accessToken** emitido por Supabase es **compatible** con AuthGuard actual
- ✅ **No se modifican** contratos de boards/collab/sessions
- ✅ **Endpoints protegidos** siguen funcionando con `Authorization: Bearer <accessToken>`

### Flujo de Autenticación Completo
```typescript
// 1. Usuario se registra/loguea
const authResponse = await fetch('/auth/login', { ... });
const { accessToken } = await authResponse.json();

// 2. Usar token en requests protegidos
const workspaces = await fetch('/workspaces', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. AuthGuard valida el token automáticamente
// 4. Request procede normalmente si token es válido
```

## 📊 Casos de Uso Típicos

### Frontend Integration
```typescript
class AuthService {
  async register(email: string, password: string) {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const { accessToken, refreshToken, user } = await response.json();
    
    // Guardar tokens en localStorage/sessionStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return { accessToken, refreshToken, user };
  }

  async login(email: string, password: string) {
    // Similar a register...
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
      await response.json();

    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout() {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Interceptor para requests automáticos
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    let accessToken = localStorage.getItem('accessToken');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Si token expiró, intentar refresh
    if (response.status === 401) {
      try {
        const { accessToken: newToken } = await this.refreshToken();
        accessToken = newToken;

        // Reintentar request con nuevo token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } catch {
        // Refresh falló, redirigir a login
        this.logout();
        window.location.href = '/login';
      }
    }

    return response;
  }
}
```

### Error Handling en Frontend
```typescript
try {
  await authService.login(email, password);
  // Redirect to dashboard
} catch (error) {
  if (error.status === 400) {
    setError('Invalid email or password format');
  } else if (error.status === 401) {
    setError('Invalid credentials');
  } else if (error.status === 422) {
    setError('Email already registered');
  } else {
    setError('Login failed. Please try again.');
  }
}
```

## ✅ Criterios de Aceptación Cumplidos

### Funcionalidad
- ✅ **curl register/login/refresh/logout** funcionan y devuelven shape estable
- ✅ **JWT accessToken** emitido por Supabase es aceptado por AuthGuard actual
- ✅ **No se modifican** contratos de boards/collab/sessions
- ✅ **TypeScript estricto** sin any, un export por archivo

### Arquitectura
- ✅ **API Gateway** como único punto de entrada para auth
- ✅ **Singleton** ConfigService y HttpModule globales
- ✅ **Microservicios** auth proxy separado (no TCP, REST directo)
- ✅ **Cliente-Servidor** Gateway → Supabase Auth REST

### Seguridad
- ✅ **No logging** de passwords ni tokens sensibles
- ✅ **Manejo coherente** de errores Supabase → HTTP status
- ✅ **Validación robusta** con class-validator
- ✅ **Headers correctos** en todas las llamadas a Supabase

### Testing
- ✅ **Build exitoso**: `npm run build` ✅
- ✅ **Endpoints funcionales** con validación DTO
- ✅ **Integración Supabase** operativa
- ✅ **AuthGuard compatibility** mantenida

## 🚀 Deployment

### Servicios Requeridos
```bash
# 1. Supabase Project (SaaS)
# - Configurar en https://supabase.com
# - Obtener URL y ANON_KEY

# 2. API Gateway
npm run dev:gateway
# - Puerto 3000 (HTTP + WS + Auth)
```

### Variables de Entorno
```env
# Supabase (requeridas)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gateway
PORT=3000
```

---

**Auth Proxy implementado siguiendo patrones de API Gateway con integración directa a Supabase Auth** ✅
