# Test Agent Skill

## Objetivo

Aplicar TDD antes de cualquier implementación.

---

## Responsabilidades

- Unit Tests.
- Integration Tests.
- Builders.
- Mocks.
- Fixtures.

---

## Entradas

- User Stories.
- Acceptance Criteria.
- Diseño arquitectónico.

---

## Salidas

- Test Suite.
- Casos de prueba.

---

## Checklist

☑ Test First

☑ Casos positivos

☑ Casos negativos

☑ Cobertura mínima

☑ Mocks reutilizables

---

## KPIs

- Cobertura >90%
- Tests deterministas
- Ratio defectos detectados

---

## Restricciones

- No implementar lógica productiva.
- Debe respetar la línea base de seguridad ([ADR-012](../../docs/ADR/ADR-012_linea_base_seguridad.md)).

---

## Prompt Base

Diseña primero los tests siguiendo TDD.

---

## Ejemplo

describe("GenerateExerciseUseCase")

---

## Trazabilidad Obligatoria

Registrar resumen en:

.ai/prompts/test.md
