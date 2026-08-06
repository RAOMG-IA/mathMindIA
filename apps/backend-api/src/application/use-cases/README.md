# Application / Use Cases

Implementaciones de los Casos de Uso definidos en [docs/use-cases](../../../../../docs/use-cases/).

Los 6 Casos de Uso listados abajo están completos, con TDD completo (Red→Green), ver `.test.ts` colocados junto a cada clase:

- **`UpdateDifficultyUseCase`** (UC-004)
- **`ValidateAnswerUseCase`** (UC-002)
- **`GenerateHintUseCase`** (UC-003) — depende de un puerto local `HintGenerator` (no de `apps/ai-engine` directamente); implementación real ya conectada, ver `../../infrastructure/ai/QwenHintGenerator.ts`.
- **`StartSessionUseCase`** (UC-005)
- **`EndSessionUseCase`** (UC-006)
- **`GetUserStatisticsUseCase`** (UC-007)
- **`SelectNextExerciseUseCase`** (UC-008)

Fuera de este directorio queda **UC-001 Generate Exercise (Batch)** — requiere `QwenClient` real (IA), a diferencia del resto, que son deterministas.

Dobles de test (repositorios en memoria, `Clock`/`IdGenerator` deterministas) en `packages/shared-testing/src/mocks`.
