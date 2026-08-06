# Developer Agent
Implement only after tests exist. Follow TDD and Clean Architecture.

---

## 2026-08-06 — Implementación de computeNextDifficulty (TDD Green)

**Input**: Confirmación del usuario para implementar `computeNextDifficulty` tras el Red de 8/8 tests fallidos (Test Agent, fase previa). Primera activación del Developer Agent en el proyecto.

**Contexto utilizado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts` (8 tests con valores calculados a mano, la especificación real a satisfacer), docs/ADR/ADR-005-adaptive-difficulty-engine.md (fórmulas 1-5), restricción de la skill ("Debe respetar Clean Architecture, Contratos existentes, Casos de uso definidos" — función pura sin I/O ni dependencias de framework).

**Decisión tomada**: Implementación directa de las 5 fórmulas de ADR-005 (`computeExpectedScore`, `computeActualScore` con clamp, `computeK` con tope de racha, actualización simétrica de `userRating`/`exerciseRating`), reemplazando el `declare function` de la fase Red. `K_base` fijo en 32 (K provisional/cold start sigue diferido, ver nota en ADR-005).

**Problema real encontrado y corregido de paso**: al ejecutar `turbo run test` por primera vez en todo el monorepo (no solo el paquete tocado), los paquetes sin tests todavía fallaban con `No test files found, exiting with code 1` — habría roto el pipeline de test para cualquiera que lo ejecutara en la raíz. Corregido añadiendo `--passWithNoTests` (flag real de vitest, verificado con `--help`) a los 8 `package.json` con script `test`.

**Output generado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.ts` (implementación completa). Verificado: `vitest run` → **8/8 tests en verde** (primer intento, sin necesitar ajustes — los cálculos a mano de la fase Red coincidieron). `npx turbo run typecheck lint test`: todo en verde en los 12-22 paquetes según la tarea.