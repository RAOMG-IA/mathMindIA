# Prompts

Plantillas de prompt para Qwen. Contrato de entrada/salida definido como tipos TypeScript en [`GenerateExercise.ts`](GenerateExercise.ts) (UC-001) y [`GenerateHint.ts`](GenerateHint.ts) (UC-003).

**Pendiente**: validación en tiempo de ejecución de esos contratos. Un `interface` de TypeScript se borra en compilación — no sirve para validar la respuesta real de Qwen antes de usarla con `.withStructuredOutput()` de LangChain, que necesita un schema real (p. ej. Zod). No se decide aquí qué librería usar porque no está fijada en [ADR-001](../../../../docs/ADR-001_LenguajesMetodologias.md) — mismo criterio ya aplicado a `shared-config` y a la librería de navegación de `mobile-app`.

Las plantillas de prompt en sí (texto del `system prompt`, ejemplos few-shot) tampoco están escritas todavía — solo la forma de datos que entra y sale.

