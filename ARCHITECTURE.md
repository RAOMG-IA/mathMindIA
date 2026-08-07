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