# ADR-000: Estructura General del Proyecto

## Estado

Aceptado

## Contexto

Este documento fijaba originalmente, en un único archivo, la visión de producto, la arquitectura, la metodología, el sistema de agentes, las reglas de gobierno y el estado de avance del TFM MathMind AI. Esa mezcla dificultaba mantenerlo: el estado de avance cambia semana a semana, mientras que las decisiones de arquitectura y agentes deberían permanecer estables una vez aceptadas.

Se divide en:

- **ADR-000** (este documento): estructura general — objetivo, funcionalidades, arquitectura, monorepo, índice de documentación.
- **[ADR-001_LenguajesMetodologias.md](ADR-001_LenguajesMetodologias.md)**: stack tecnológico y metodologías (TDD/SDD).
- **[ADR-002_Agentes.md](ADR-002_Agentes.md)**: sistema multiagente.
- **[ADR-003_Trazabilidad.md](ADR-003_Trazabilidad.md)**: reglas de TDD enforcement, reutilización y trazabilidad.- **docs/ADR/Security/**: decisiones de seguridad y gobernanza para agentes de IA, gestión de secretos, control de acceso, protección de prompts, clasificación de datos y filtrado de contexto.
La estrategia de uso de IA (qué se le permite hacer y qué no) vive en **[ARCHITECTURE.md](../ARCHITECTURE.md)** (raíz del repo), que ya la define; no se duplica aquí.

## Decisión

### Objetivo

Plataforma Web/Mobile de entrenamiento de cálculo mental adaptativo potenciada por IA.

Niveles educativos:

- Primaria
- Secundaria
- Bachillerato
- Ingeniería

La dificultad se adapta dinámicamente según el rendimiento del usuario (ver [ADR-005](ADR/ADR-005-adaptive-difficulty-engine.md)).

### Funcionalidades Principales

#### Modo Test

- 3 respuestas posibles.
- Tiempo límite configurable.
- Corrección inmediata.
- Explicación de solución.

#### Modo Resolución

- Introducción manual de respuesta.
- Tiempo límite configurable.
- Pistas progresivas.
- Explicación paso a paso.

#### Gamificación

- Score.
- Nivel.
- Estadísticas.
- Historial.
- Logros (futuro).

### Arquitectura General

```text
Mobile App (React Native + Expo)
        │
        ▼
Backend API (Node.js + Express)
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
Redis      PostgreSQL
        │
        ▼
AI Engine
(LangChain + Qwen)
```

Detalle completo de reglas y capas en [ARCHITECTURE.md](../ARCHITECTURE.md).

### Monorepo

```text
mathMindIA
├── apps
│   ├── mobile-app
│   ├── backend-api
│   └── ai-engine
│
├── packages
│   ├── shared-domain
│   ├── shared-types
│   ├── shared-utils
│   ├── shared-testing
│   ├── shared-config
│   └── shared-constants
│
├── docs
├── database
├── docker
└── scripts
```

### Clean Architecture

```text
Presentation
     ↓
Application
     ↓
Domain

Infrastructure
     ↓
Application
     ↓
Domain
```

### Documentación Principal

- [README.md](../README.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- AGENTS.md

### Diagramas Definidos

- Context Diagram
- Container Diagram
- Clean Architecture
- Adaptive Difficulty Engine
- Exercise Pipeline
- Sequence Diagram
- AI Development Workflow

Formato:

- Mermaid (`.mmd`) en `docs/diagrams/`
- SVG exportado en `docs/images/`

## Consecuencias

- Cada ADR queda enfocado en una decisión estable, sin mezclarse con estado mutable.
- El seguimiento de avance vive en `STATUS.md` y puede actualizarse sin generar ruido en el historial de decisiones arquitectónicas.
- Riesgo: mantener la coherencia entre varios documentos pequeños requiere disciplina de enlazado cruzado (se mitiga enlazando explícitamente entre ADRs en vez de repetir contenido).
