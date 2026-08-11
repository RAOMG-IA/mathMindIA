# Prompts

Plantillas de prompt agnósticas de proveedor de IA. Contrato de entrada/salida definido como tipos TypeScript en [`GenerateExercise.ts`](GenerateExercise.ts) (UC-001) y [`GenerateHint.ts`](GenerateHint.ts) (UC-003), más `generateExerciseOutputSchema`/`generateHintOutputSchema` (Zod, [ADR-001](../../../../docs/ADR-001_LenguajesMetodologias.md) adenda 2026-08-06) para validar la forma del output en tiempo de ejecución antes de usarlo con `.withStructuredOutput()` de LangChain. Validan forma, no invariantes de dominio (esas siguen siendo responsabilidad de quien consuma el resultado — UC-001, todavía sin construir).

`buildGenerateExercisePrompt`/`buildGenerateHintPrompt`: prompts mínimos funcionales, usados por `IAClient` ([`../llm/IAClient.ts`](../llm/IAClient.ts)). El texto real — afinado, few-shot — sigue pendiente, es trabajo de calidad, no bloqueante.
