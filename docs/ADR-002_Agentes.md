# ADR-002: Sistema Multiagente

## Estado

Aceptado

## Contexto

MathMind AI se desarrolla con apoyo de agentes de IA especializados, cada uno con responsabilidades, entradas/salidas y restricciones propias. Este ADR fija esa jerarquía y división de responsabilidades, para que ningún agente invada el rol de otro ni se dupliquen funciones.

## Decisión

### Jerarquía

```text
Usuario
 ↓
Project Director
 ↓
Project Orchestrator
 ↓
Knowledge Manager
 ↓
Agentes Operativos
```

### Agentes Estratégicos

#### Project Director

- Interacción con usuario.
- Refinado de prompts.
- Optimización de contexto.
- Conservación de intención.

#### Project Orchestrator

- Coordinación.
- Planificación.
- Workflow.
- Dependencias.

#### Knowledge Manager

- Recuperación de contexto.
- Búsqueda documental.
- Análisis de impacto.
- Detección de duplicidades.
- Consistencia arquitectónica.

Mejoras incorporadas a este rol:

- Recuperación de contexto.
- Localización documental.
- Detección de duplicidades.
- Detección de conflictos arquitectónicos.
- Análisis de impacto.
- Consulta de ADRs.

### Agentes Operativos

#### Product Agent

- User Stories.
- Casos de uso.
- Acceptance Criteria.

#### Architecture Agent

- Diagramas.
- ADRs.
- Diseño técnico.

#### Test Agent

- Unit Tests.
- Integration Tests.
- Builders.
- Fixtures.
- Mocks.

#### Developer Agent

- Implementación.
- Refactorización.

#### Reviewer Agent

- Revisión técnica.
- Revisión arquitectónica.
- Calidad.
- Deuda técnica.

#### Security Agent

- OWASP.
- Hardening.
- Dependencias.

#### Documentation Agent

- README.
- Architecture.
- ADR.
- Diagramas.

#### DevOps Agent

- Docker.
- CI/CD.
- GitHub Actions.

### Decisión sobre QA Agent

Se elimina como agente independiente. Sus responsabilidades quedan cubiertas por:

- Product.
- Test.
- Reviewer.
- Security.

### Flujo Final de Desarrollo

```text
Product
 ↓
Architecture
 ↓
Test
 ↓
Developer
 ↓
Reviewer
 ↓
Security
 ↓
Documentation
```

### Skills Definidas

Un archivo de skill por agente:

```text
director.md
orchestrator.md
knowledge-manager.md
product.md
architecture.md
test.md
developer.md
reviewer.md
security.md
documentation.md
devops.md
```

Todas incluyen la misma estructura:

- Objetivo
- Responsabilidades
- Entradas
- Salidas
- Checklist
- KPIs
- Restricciones
- Prompt Base
- Ejemplos
- Trazabilidad

## Consecuencias

- Responsabilidades no solapadas: cada agente tiene un dominio claro, reduciendo ambigüedad sobre quién decide qué.
- El flujo Product→Architecture→Test→Developer→Reviewer→Security→Documentation es lineal; no define explícitamente bucles de retrabajo si un agente posterior rechaza el trabajo de uno anterior — se deja como mejora futura, no bloquea el uso actual del flujo.
- La trazabilidad de cada agente se registra según [ADR-003](ADR-003_Trazabilidad.md), no aquí.
