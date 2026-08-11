# Infrastructure / AI

`QwenHintGenerator` — implementación real del puerto `HintGenerator` ([`../../application/use-cases/GenerateHintUseCase.ts`](../../application/use-cases/GenerateHintUseCase.ts), UC-003). Envuelve `IAClient` de `@mathmind/ai-engine` (import directo in-process — [ADR-001](../../../../../docs/ADR-001_LenguajesMetodologias.md): backend-api y ai-engine no se comunican por HTTP en este TFM).

Implementado y testeado (TDD Red→Green, 2/2) con un fake estructural de `IAClient` (`Pick<IAClient, 'generateHint'>`), sin LangChain real.
