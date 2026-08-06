# LLM

- `ChatModel` — puerto minimo (`invoke(prompt): Promise<string>`) que desacopla `QwenClient` de LangChain concreto, permite TDD sin red real.
- `QwenClient` — implementado y testeado (TDD Red->Green, 5/5). Recibe un `ChatModel` por constructor; arma el prompt (`../prompts`), invoca el modelo, parsea y valida la forma con Zod (`generateExerciseOutputSchema`/`generateHintOutputSchema`, ADR-001 adenda 2026-08-06).
- `LangChainQwenModel` — implementacion real de `ChatModel` (envuelve `ChatOpenAI` de LangChain contra el endpoint OpenAI-compatible de Qwen/DashScope, `QWEN_API_KEY`/`QWEN_BASE_URL`). **Sin tests automaticos** -- depende de red real, gap aceptado explicitamente (igual que las implementaciones `Prisma*Repository`).

Consumido por `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts` (adaptador del puerto `HintGenerator` de UC-003) via import directo in-process (ADR-001: backend-api y ai-engine no se comunican por HTTP).
