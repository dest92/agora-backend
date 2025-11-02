---
trigger: always_on
---

name: Agora Backend – Clean TS/Nest, Microservices & EDA (Nest-only)
description: Enforce backend rules alineadas con el documento de Arquitectura Ágora, usando solo NestJS (sin Fastify).
tags: [agora, backend, architecture, microservices, event-driven, websocket, redis, yjs, postgres, nestjs]
run_on: [create, edit, diff_review]
scope: ["backend/**", "services/**", "apps/api/**", "**/*.ts", "**/*.md"]

rules:
  - Persona: |
      You are a senior TypeScript programmer with experience in the NestJS framework and a preference for clean programming and design patterns.
      Generate code, corrections, and refactorings that comply with the basic principles and nomenclature.

  - TypeScript & Code Style Baseline: |
      ## TypeScript General Guidelines
      ### Basic Principles
      - Use English for all code and documentation.
      - Always declare the type of each variable and function (parameters and return value).
      - Avoid using any; create necessary types.
      - Use JSDoc on public classes and methods.
      - No blank lines inside functions.
      - One export per file.
      ### Nomenclature
      - PascalCase for classes. camelCase for variables/functions/methods. kebab-case for files/dirs. UPPERCASE for env vars.
      - No magic numbers; define constants.
      - Verbal function names; booleans start with is/has/can.
      - Full words; allow API/URL and conventional i, j, err, ctx, req, res, next.
      ### Functions
      - Short, single-purpose (< 20 statements). Early returns. Prefer map/filter/reduce.
      - Arrow fn for ≤ 3 statements; named fn otherwise.
      - Default parameter values. Use RO-RO (object in/out) with declared types.
      ### Data
      - Encapsulate data in composite types. Prefer immutability (`readonly`, `as const`).
      ### Classes
      - SOLID. Prefer composition. Define interfaces as contracts. Small classes (<200 stmts, <10 public methods, <10 props).
      ### Exceptions
      - Throw for unexpected errors. Catch only to fix expected issues or add context; otherwise let global handlers act.
      ### Testing
      - Arrange-Act-Assert. Clear names (inputX, mockX, actualX, expectedX).
      - Unit tests for each public function (test doubles for deps).
      - Acceptance tests per module (Given-When-Then).

  - NestJS Module Layout: |
      - Modular architecture: one main module per domain/route; primary controller for that route; secondary controllers if needed.
      - `models/` para tipos de datos:
        - DTOs con `class-validator` para inputs; tipos simples para outputs.
      - `services/` para lógica de negocio y persistencia:
        - Repository/DAO por agregado sobre PostgreSQL.
      - Core module: global exception filters, middlewares, guards, interceptors.
      - Shared module: utilidades y lógica transversal.
      - Agregar `admin/test` en cada módulo (smoke).

  - Architecture & Patterns (STRICT): |
      - **Microservices backend** con límites claros por capacidad (users/auth, sessions, sync, notifications).
      - **Event-Driven Architecture (EDA)** para tiempo real y desac acople; publicar eventos de dominio inmutables; consumir asíncronamente.
      - **Hexagonal** (Ports & Adapters): `domain/`, `application/`, `infrastructure/`; puertos en `application/ports`, adaptadores en `infrastructure/adapters` (http, db, ws, cache, messaging).
      - **CQRS**: separar Commands/Queries con handlers explícitos; read models/projections para consultas complejas.
      - **Sagas** para workflows largos; coreografía preferida (orquestación solo si es necesaria).
      - **Idempotency** en comandos (dedup keys); **Observer** sobre WebSockets para push.
      - **CRDT (Yjs)** para edición y estado compartido en tiempo real cuando aplique.

  - Technologies (STRICT): |
      - Runtime: **Node.js 20+** con TypeScript `strict`.
      - Framework: **NestJS** (HTTP y WebSockets con `@nestjs/websockets` + `socket.io`).
      - Backplane/Messaging: **Redis** (Pub/Sub o Streams) para fan-out, presence y coordinación entre nodos.
      - Database: **PostgreSQL** (ACID) como almacenamiento principal.
      - AuthN/AuthZ: **OIDC/JWT** (Supabase Auth verificado en guard de Nest); **RBAC** en capa de aplicación.
      - Contenedores/Orquestación: Docker; **Kubernetes** (readiness/liveness, HPA).
      - Observabilidad: **OpenTelemetry** (traces/metrics) con endpoints para **Prometheus**; logs estructurados (Loki-ready).

  - Non-Functional Requirements → Acceptance Targets: |
      - Real-time latency: **p95 ≤ 200 ms** entre acción y fan-out.
      - Concurrencia: **≥ 50 000 sesiones** simultáneas sin degradación material.
      - Disponibilidad: **≥ 99.9%** mensual.
      - Seguridad: **TLS 1.3**, validación estricta de entrada, aislamiento por sesión/tenant.
      - Accesibilidad: **WCAG AA**.
      - Mantenibilidad: servicios modulares; cambios aislados sin romper consumidores/eventos.

  - Implementation Guardrails: |
      - Controladores delgados; orquestación en application services; dominio libre de framework.
      - Evitar llamadas síncronas entre servicios en paths calientes; preferir eventos. Si son necesarias, usar timeouts, retries, circuit breakers.
      - Claves de idempotencia en comandos reintentos.
      - Escalado WS: `socket.io-redis` adapter para fan-out multi-pod.
      - Aislamiento de sesión: rooms/topics por sesión/usuario.
      - Rejoin/recovery: al reconectar, restaurar estado desde read model/CRDT.

  - Testing Requirements: |
      - Unit tests para dominio y application services (sin red).
      - Integration para adaptadores (HTTP, WS, Redis, DB) — usar **Testcontainers** para PostgreSQL/Redis.
      - E2E por servicio: HTTP + WS (happy paths, presence, reconexión, permisos).
      - Contract tests para eventos publicados (esquemas versionados).

  - Security & Compliance: |
      - TLS 1.3, headers seguros, CORS endurecido.
      - Validar DTOs, sanitizar inputs, rate limiting por IP/usuario/sesión.
      - Least privilege en DB/Redis; secretos rotados vía env/secret manager.
      - Auditoría mínima por sesión exportable (CSV/PDF/JSON).

  - Definition of Done (per PR): |
      - RNF en presupuesto (latencia local/profiling).
      - Unit/Integration/E2E en verde.
      - Tracing en paths críticos (emit WS, publish Redis, write DB).
      - Sin lógica de negocio en controladores; sin fugas cross-sesión; eventos documentados.

