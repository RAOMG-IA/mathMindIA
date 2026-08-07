# Application / Use Cases

Implementaciones de los Casos de Uso definidos en [docs/use-cases](../../../../../docs/use-cases/).

Los 9 Casos de Uso listados abajo están completos, con TDD completo (Red→Green), ver `.test.ts` colocados junto a cada clase:

- **`RegisterUseCase`** (UC-009) — hash de contraseña vía `PasswordHasher`, credenciales persistidas separadas de `User` (`UserCredentialsRepository`, ver ADR-004).
- **`LoginUseCase`** (UC-010) — mismo mensaje de error genérico para email inexistente y contraseña incorrecta (ADR-012).
- **`UpdateDifficultyUseCase`** (UC-004)
- **`ValidateAnswerUseCase`** (UC-002) — verifica que la `Session` pertenezca al `userId` autenticado (hueco IDOR corregido).
- **`GenerateHintUseCase`** (UC-003) — depende de un puerto local `HintGenerator`; implementación real ya conectada, ver `../../infrastructure/ai/QwenHintGenerator.ts`. Misma verificación de autorización que UC-002.
- **`StartSessionUseCase`** (UC-005)
- **`EndSessionUseCase`** (UC-006) — misma verificación de autorización que UC-002.
- **`GetUserStatisticsUseCase`** (UC-007) — depende de `TemaRepository` para resolver `area` por tema.
- **`SelectNextExerciseUseCase`** (UC-008)

Fuera de este directorio queda **UC-001 Generate Exercise (Batch)** — vive en `apps/ai-engine/src/batch` (actor Sistema/batch, no Application de backend-api).

Dobles de test (repositorios en memoria, `Clock`/`IdGenerator`/`PasswordHasher`/`TokenIssuer` deterministas) en `packages/shared-testing/src/mocks`.
