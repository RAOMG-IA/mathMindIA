# Architecture

## Propósito

Este documento define las reglas arquitectónicas que deben seguir tanto los desarrolladores humanos como los agentes de IA involucrados en el proyecto.

Su objetivo es garantizar:

- Consistencia.
- Mantenibilidad.
- Escalabilidad.
- Testabilidad.
- Separación de responsabilidades.

---

# Visión General

MathMind AI es una plataforma distribuida compuesta por tres aplicaciones principales.

```text
┌────────────────────┐
│ Mobile Application │
│ React Native       │
└──────────┬─────────┘
           │
           ▼

┌────────────────────┐
│ Backend API        │
│ Express            │
└──────────┬─────────┘
           │
      ┌────┴─────┐
      │          │
      ▼          ▼

 PostgreSQL    AI Engine

                  │
                  ▼

             LangChain
                  │
                  ▼

                Qwen
```

---

# Principios Arquitectónicos

## Regla 1

La lógica de negocio nunca dependerá de frameworks.

Correcto:

```text
Domain
 └─ User
```

Incorrecto:

```text
User extends PrismaUser
```

---

## Regla 2

Los casos de uso contienen la lógica de aplicación.

La lógica no debe implementarse en:

- Controllers
- Routes
- React Components
- Servicios externos

---

## Regla 3

Las dependencias siempre apuntan hacia el dominio.

```text
Presentation
      │
      ▼
Application
      │
      ▼
Domain
```

Nunca al contrario.

---

## Regla 4

Todo cambio funcional debe estar cubierto por tests.

No se aceptará código sin pruebas automatizadas.

---

# Monorepo

```text
apps/
packages/
docs/
```

---

# Aplicaciones

## mobile-app

Responsabilidades:

- UX/UI
- Navegación
- Gestión del estado
- Consumo API

No contiene:

- Lógica de negocio crítica
- Reglas matemáticas

---

## backend-api

Responsabilidades:

- Autenticación
- Casos de uso
- Persistencia
- Gestión de sesiones
- Adaptación de dificultad

Es el núcleo operativo del sistema.

---

## ai-engine

Responsabilidades:

- Generación de ejercicios
- Generación de pistas
- Explicaciones
- Procesos batch

No participa en el flujo crítico de todas las peticiones.

---

# Shared Packages

## shared-domain

Contiene:

```text
Entities
Value Objects
Enums
Repository Contracts
Domain Services
```

Ejemplos:

```text
User
Exercise
Session
AcademicLevel
Difficulty
```

---

## shared-types

Contratos DTO compartidos.

Ejemplos:

```text
ExerciseDto
UserDto
GenerateExerciseRequest
```

---

## shared-utils

Utilidades genéricas reutilizables.

Ejemplos:

```text
Math helpers
Validation helpers
Date helpers
```

---

## shared-testing

Infraestructura común de testing.

Ejemplos:

```text
Builders
Fixtures
Mocks
Factories
```

---

## shared-constants

Valores globales.

Ejemplos:

```text
Difficulty ranges
Academic levels
Game limits
Timeouts
```

---

## shared-config

Configuración común.

Ejemplos:

```text
Environment configuration
Validation schemas
Feature flags
```

---

# Clean Architecture

## Domain

Núcleo del negocio.

No debe depender de:

- Express
- React
- PostgreSQL
- LangChain
- Redis

---

## Application

Implementa los casos de uso.

Ejemplos:

```text
GenerateExerciseUseCase
ValidateAnswerUseCase
GenerateHintUseCase
UpdateDifficultyUseCase
```

---

## Infrastructure

Implementaciones técnicas.

Ejemplos:

```text
PostgreSQL
Redis
LangChain
Qwen
Prisma
```

---

## Presentation

Interfaces de entrada.

Ejemplos:

```text
REST Controllers
Routes
Middlewares
```

---

# Estrategia IA

La IA debe utilizarse únicamente cuando aporte valor.

Uso permitido:

- Generar ejercicios.
- Generar pistas.
- Generar explicaciones.
- Crear contenido nuevo.

Uso NO recomendado:

- Cálculos simples.
- Validaciones.
- Algoritmos de dificultad.
- Reglas determinísticas.

---

# RAG (Base de Conocimiento)

Ver [ADR-014](docs/ADR/ADR-014_rag.md), [UC-011](docs/use-cases/UC-011-ingest-knowledge-base.md). Diseñado para que un administrador del sistema aporte ejercicios, notas y recomendaciones de referencia, de forma que las respuestas del agente (ejercicios y pistas generados) queden más ajustadas a ese criterio. Deposita los ficheros en un directorio local; un script (manual o cron) los ingiere en `ai-engine`:

```text
Directorio de entrada
      │
      ▼
Split en chunks (LangChain)
      │
      ▼
Embeddings locales (Xenova/transformers, sin red)
      │
      ▼
PostgreSQL + pgvector ── registro de ingesta (Postgres)
      │
      ▼
Directorio de histórico
```

`UC-001` (Generate Exercise, Batch) y `UC-003` (Generate Hint) recuperan chunks relevantes por similitud semántica (query construida desde `Tema`/`Exercise`, no desde metadata del fichero — no hay tagging fichero↔Tema en la ingesta) y los añaden al prompt antes de invocar a Qwen. Sin material consolidado, generan igual que hoy — el retrieval es aditivo, nunca bloqueante.

**pgvector, no un almacén vectorial dedicado** (p.ej. Chroma): reutiliza el mismo PostgreSQL ya usado por el resto de la aplicación, sin levantar un servicio nuevo — coherente con el resto de esta arquitectura (mono-servidor, sin Docker).

---

# Cache Strategy

Objetivo:

Reducir latencia y costes.

```text
User Request
      │
      ▼

Redis Cache
      │
      ├─ Hit
      │     ▼
      │  Response
      │
      └─ Miss
            ▼

      PostgreSQL
            │
            ▼

      AI Engine
```

---

# Entorno de Desarrollo con Docker

El stack de desarrollo local se levanta con Docker Compose ([ADR-016](docs/ADR/ADR-016_entorno_docker.md)):

- **Postgres** (`pgvector/pgvector:pg16`): base canónica de desarrollo, con pgvector preinstalado (RAG, ADR-014). Sustituye al Postgres local y desbloquea la migración formal de Prisma.
- **Redis** (`redis:7-alpine`): servicio declarado en el stack; sin consumidor de código todavía.
- **node** (`node:22`): contenedor de desarrollo del monorepo (backend-api + ai-engine + packages) con `tsx watch` en el puerto 3000.

Arranque:

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup/dev-env.ps1
# o manualmente:  docker compose up -d --build
# migración:      docker compose exec node npm run db:migrate -- --name init
# integración:    docker compose exec node npm run test:integration
# RAG:            deposita ficheros en ./rag/input y ejecuta docker compose exec node npm run ingest:rag
```

Variables configurables en `.env` raíz (plantilla `.env.example`). Sin imágenes de producción ni CI en esta fase.

---

# API REST (Rutas)

Mapeo de rutas HTTP a los Controllers ya existentes (`apps/backend-api/src/presentation/http`, `declare class` sin cuerpo) y a los DTOs de `packages/shared-types/src/dtos`. Una ruta por DTO — sin anidar recursos en la URL cuando el DTO ya lleva el identificador en el body, para no duplicar el dato en dos sitios.

| Método | Ruta | Auth | Controller.método | DTO petición → respuesta | Caso de Uso |
|---|---|---|---|---|---|
| POST | `/auth/register` | No | `AuthController.register` | `RegisterRequestDto` → `RegisterResponseDto` | US-001 |
| POST | `/auth/login` | No | `AuthController.login` | `LoginRequestDto` → `LoginResponseDto` | US-002 |
| POST | `/sessions` | Sí | `SessionController.startSession(userId, body)` | `StartSessionRequestDto` → `StartSessionResponseDto` | UC-005 |
| POST | `/sessions/end` | Sí | `SessionController.endSession` | `EndSessionRequestDto` → `EndSessionResponseDto` | UC-006 |
| POST | `/answers` | Sí | `AnswerController.submitAnswer` | `SubmitAnswerRequestDto` → `SubmitAnswerResponseDto` | UC-002 (compone UC-008 en la misma respuesta) |
| POST | `/hints` | Sí | `HintController.requestHint` | `RequestHintRequestDto` → `RequestHintResponseDto` | UC-003 |
| GET | `/users/me/statistics` | Sí | `StatisticsController.getStatistics(userId)` | — → `GetUserStatisticsResponseDto` | UC-007 |
| GET | `/temas` | Sí | `TemaController.listTemas()` | — → `GetTemasResponseDto` | ADR-006 adenda 2026-08-10 |

**Auth**: header `Authorization: Bearer <sessionToken>` (el `sessionToken` opaco ya devuelto por `register`/`login`). Un middleware lo resuelve a `userId` y lo inyecta en el `Controller` (mismo patrón que `StatisticsController.getStatistics(userId)`, nunca tomado del body — evita que un cliente suplante a otro usuario). El mecanismo interno del token (JWT vs sesión de servidor) sigue sin decidir — ver [US-002](../../docs/user-stories/US-002-login.md), "Fuera de alcance" — esta tabla solo fija el transporte (`Bearer`), no la verificación.

**Huecos detectados y corregidos al mapear**: `RequestHintRequestDto` no llevaba `elapsedMs` pese a ser input obligatorio de `GenerateHintUseCase` (verificación de tiempo expirado) — añadido. `SessionController.startSession` no tenía forma de recibir `userId` — añadido como parámetro separado del body, igual que `StatisticsController`.

**Hueco pendiente, sin resolver aquí (fuera de las restricciones de esta skill — no implementar código)**: `EndSessionUseCase`, `ValidateAnswerUseCase` y `GenerateHintUseCase` reciben `sessionId` pero ninguno verifica que la `Session` pertenezca al `userId` autenticado — un usuario podría finalizar/responder/pedir pistas sobre la sesión de otro si adivina o filtra su `sessionId` (IDOR). Antes de implementar los Controllers reales, el Developer Agent debe añadir esa verificación de autorización (comparar `session.userId` contra el `userId` del token) con sus tests correspondientes.

---

# Reglas para Agentes IA

Todo agente de desarrollo debe seguir estas reglas:

1. Respetar Clean Architecture.
2. No introducir dependencias circulares.
3. No duplicar tipos ya existentes.
4. Priorizar reutilización de paquetes compartidos.
5. Escribir tests antes de implementar funcionalidad.
6. Mantener tipado estricto en TypeScript.
7. Evitar lógica de negocio en componentes React.
8. Evitar lógica de negocio en controllers.
9. Utilizar DTOs para comunicación entre capas.
10. Documentar decisiones arquitectónicas significativas mediante ADR.

---

# ADRs

Cada decisión arquitectónica relevante debe documentarse.

Ubicación:

```text
docs/ADR
```

Ejemplos:

```text
ADR-001 Clean Architecture
ADR-002 Monorepo
ADR-003 Redis Cache
ADR-004 Qwen Selection
ADR-005 Adaptive Difficulty Engine
```