# Batch

`GenerateExerciseBatchUseCase` ([UC-001](../../../../docs/use-cases/UC-001-generate-exercise-batch.md)) — implementado y testeado (TDD Red->Green, 5/5). Genera un Exercise via Qwen (reintenta hasta `MAX_ATTEMPTS=3` si viola las invariantes de ADR-004) y lo persiste con `generatedBy='ai-batch'`. No participa en el flujo critico de cada peticion del usuario ([ARCHITECTURE.md](../../../../ARCHITECTURE.md), "Estrategia IA").

Fuera de esta clase: seleccionar que Tema/AcademicLevel tiene escasez en el Pool (paso 1 del UC) -- llega ya resuelto como input, decidido por un scheduler todavia sin construir.

(UC-003, generacion de pistas bajo demanda, vive en `apps/backend-api/src/application/use-cases/GenerateHintUseCase.ts` + `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts` -- no aqui.)
