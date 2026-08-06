# Product Agent
Generate user stories, acceptance criteria, backlog and roadmap.

---

## 2026-08-05 — User Stories US-001 a US-007

**Input**: Organizar las User Stories candidatas de STATUS.md (pendiente #4) en `docs/user-stories/*`, un archivo por historia.

**Contexto utilizado**: STATUS.md (lista candidata US-001 a US-007), ADR-004 (entidades User/Session/Exercise/Answer/Hint), ADR-005 (rating y racha), ADR-006 (taxonomía de temas), README.md (Modo Test/Resolución), .ai/skills/product.md (formato Como/Quiero/Para + INVEST, restricción de no diseñar arquitectura).

**Decisión tomada**: 7 historias con criterios de aceptación en Gherkin. Se distinguió explícitamente US-002 (Login, autenticación) de US-003 (Iniciar Sesión de Entrenamiento, arranque de `Session` de práctica) por posible confusión de nombres. Se detectó que US-007 (Ver Estadísticas) no tiene caso de uso asignado entre UC-001 y UC-006 — queda como nota para cuando se definan Casos de Uso.

**Output generado**: [docs/user-stories/](../../docs/user-stories/) (README índice + US-001 a US-007).