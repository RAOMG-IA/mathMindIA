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

## Adenda (2026-08-07): Contrato de Handoff obligatorio

### Motivación

Verificado en la práctica que la jerarquía de decisión (Usuario→Director→Orchestrator→Knowledge Manager→Agentes Operativos) y el flujo obligatorio (Product→Architecture→Test→Developer→Reviewer→Security→Documentation) definidos arriba no se estaban siguiendo: ninguna tarea pasó realmente por Director/Orchestrator/Knowledge Manager, y Reviewer/Security se saltaron en la implementación de autenticación real (detectado y corregido, ver `STATUS.md` #28). El problema no era que el flujo estuviera mal diseñado — era que no existía ningún punto de control que impidiera saltárselo. Este contrato de handoff es ese punto de control.

### Decisión

Todo cambio o tarea que no sea un fix trivial de una línea debe pasar por un **handoff estructurado** antes de iniciar la ejecución, con estos campos obligatorios:

```yaml
handoff:
  requester: ""        # "User" o nombre del agente que origina la cascada (p. ej. Orchestrator -> Test)
  objective: ""        # finalidad del trabajo y resultado esperado
  scope: ""             # alcance explicito y limites de la tarea
  constraints: []       # restricciones tecnicas, arquitectonicas, de seguridad y de negocio
  references: []        # ADRs, casos de uso, historias de usuario, documentos relacionados
  acceptance: []        # criterios de aceptacion verificables
  risks: []              # riesgos conocidos, bloqueantes o dependencias
  required_agents: []   # agentes que deben intervenir o revisar
```

`required_agents` por defecto es la lista completa del "Flujo Obligatorio de Desarrollo" (`AGENTS.md`) — Product, Architecture, Test, Developer, Reviewer, Security, Documentation. Omitir alguno de esa lista por defecto exige una justificación explícita dentro del propio handoff (p. ej. "Security no aplica: cambio de solo documentación, sin código"), no un silencio que se descubre después.

### Regla de validación

Antes de ejecutar, el **Orchestrator** (o el **Director** si el Orchestrator no interviene en una tarea pequeña) valida que el handoff tenga los 8 campos. Si falta alguno obligatorio, la tarea no avanza — se devuelve al emisor a completar el contexto.

### Relación con ADR-003 (Trazabilidad)

El handoff es el contrato de **entrada** a una tarea (qué se pide, con qué límites) — no sustituye ni duplica las entradas de `.ai/prompts/<agente>.md` que ya exige [ADR-003](ADR-003_Trazabilidad.md) (Input/Contexto utilizado/Decisión tomada/Output generado), que documentan la **salida** (qué se hizo de verdad). Cada entrada de trazabilidad de un agente operativo debería poder señalar a qué handoff responde.

### Dónde se registra

No se crea un tipo de fichero nuevo: cada handoff se registra en `.ai/prompts/orchestrator.md` (o `director.md` si lo emite directamente el Director) antes de que las entradas de los agentes operativos aparezcan en sus propios ficheros — mismo formato de trazabilidad ya usado en el resto de `.ai/prompts/`.

### Ejemplo resuelto

Ver la primera entrada real de `.ai/prompts/orchestrator.md` (2026-08-07) — el handoff de esta misma adenda, como caso de uso del mecanismo desde el momento en que se define.

## Consecuencias

- Responsabilidades no solapadas: cada agente tiene un dominio claro, reduciendo ambigüedad sobre quién decide qué.
- El flujo Product→Architecture→Test→Developer→Reviewer→Security→Documentation es lineal; no define explícitamente bucles de retrabajo si un agente posterior rechaza el trabajo de uno anterior — se deja como mejora futura, no bloquea el uso actual del flujo.
- La trazabilidad de cada agente se registra según [ADR-003](ADR-003_Trazabilidad.md), no aquí.
- El Contrato de Handoff (adenda 2026-08-07) es el mecanismo que fuerza a recorrer la jerarquía de decisión y el flujo obligatorio en la práctica, no solo sobre el papel.
