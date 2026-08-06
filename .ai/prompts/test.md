# Test Agent
Create tests before implementation. Produce unit, integration tests, mocks and fixtures.

---

## 2026-08-06 — Tests de AdaptiveDifficultyEngine (TDD Red)

**Input**: Confirmado con el usuario que los tests del `AdaptiveDifficultyEngine` trazan a US-004 (AC "el siguiente ejercicio refleja la nueva dificultad calculada") y ADR-005 (fórmulas). Primera activación del Test Agent en el proyecto.

**Contexto utilizado**: docs/user-stories/US-004-resolver-ejercicio.md (User Story + AC), docs/ADR/ADR-005-adaptive-difficulty-engine.md (fórmulas exactas, fuente de los valores esperados), .ai/skills/test.md (Entradas requeridas: User Stories + AC + Diseño arquitectónico — las tres ya existían).

**Decisión tomada**: 8 casos de test en `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts`, valores calculados a mano contra las fórmulas de ADR-005 (no aproximados): ratings iguales con acierto/fallo/límite de tiempo, modulación y tope de racha, ratings desiguales en ambas direcciones, y el caso `responseTimeMs > timeLimitMs`. Se materializó la interfaz de ADR-005 como `declare function` (firma real, sin cuerpo) para poder importarla sin escribir lógica productiva (restricción explícita de esta skill). **Hueco de diseño real detectado**: el K provisional (cold start) de ADR-005 necesita un contador de intentos por nivel que no existe en `User` — diferido explícitamente, documentado en ADR-005, los tests cubren `K_base=32` fijo.

**Output generado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.ts` (interfaz + constantes + firma sin implementar) y `AdaptiveDifficultyEngine.test.ts` (8 tests). Verificado: `turbo typecheck` 13/13 en verde; `vitest run` → **8/8 tests fallan con `TypeError: computeNextDifficulty is not a function`** — Red confirmado por la razón correcta (falta implementación), no por error de configuración. Implementación (Developer Agent, fase Green) no ejecutada — pendiente de confirmación aparte del usuario.