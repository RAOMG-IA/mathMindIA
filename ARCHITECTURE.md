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