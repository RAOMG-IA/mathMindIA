# Presentation / HTTP

Controllers REST (`AuthController`, `SessionController`, `AnswerController`, `HintController`, `StatisticsController`) — firmas de clase ya declaradas (`declare class`, sin cuerpo), tipadas contra los DTOs de `packages/shared-types`. No conocen Express directamente: el mapeo Request/Response ↔ DTO (rutas, middlewares) sigue sin definir.

Pendiente de implementar — requiere Tests (TDD Enforcement Rule, [ADR-003](../../../../../docs/ADR-003_Trazabilidad.md)). Ya existen dos Casos de Uso reales que los controllers podrán invocar (`UpdateDifficultyUseCase`, `ValidateAnswerUseCase` en [`../../application/use-cases`](../../application/use-cases/README.md)), pero el mapeo Request/Response ↔ DTO sigue sin definir.
