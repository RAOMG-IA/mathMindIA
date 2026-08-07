# Reviewer Agent
Review code quality, architecture compliance, complexity and SOLID principles.

---

## 2026-08-07 — Primera pasada real (backend/auth: Register/Login, 5 Controllers, adaptadores de auth)

**Input**: El usuario detectó que Reviewer y Security nunca se habían invocado en el proyecto pese a que `.ai/AGENTS.md` los exige como fases obligatorias del flujo ("Ninguna fase puede omitirse"). Este archivo llevaba desde su creación con la cabecera equivocada ("# Test Agent", corregida en esta misma entrada) — señal adicional de que nunca se había usado de verdad.

**Contexto utilizado**: `.ai/skills/reviewer.md` (checklist: naming, arquitectura respetada, complejidad razonable, SOLID), `ARCHITECTURE.md` (regla 8, "Evitar lógica de negocio en controllers"). Alcance: `RegisterUseCase`/`LoginUseCase`, los 5 Controllers, `routes.ts`, `main.ts`, `BcryptPasswordHasher`/`JwtTokenIssuer`, `authMiddleware`.

**Hallazgos**:
1. **`main.ts`**: `IdGenerator`/`Clock` se instancian como literales de objeto anónimos inline (`{ generate: () => crypto.randomUUID() }`, `{ now: () => new Date() }`) en vez de clases propias en `infrastructure/`, rompiendo la simetría con `BcryptPasswordHasher`/`JwtTokenIssuer` (que sí son adaptadores nombrados). No bloqueante, pero inconsistente.
2. **`routes.ts`**: `handleError` devuelve siempre HTTP 400, sin distinguir "no encontrado" (404), "conflicto" (409 — email duplicado en registro) o "prohibido" (403 — IDOR). Cuando se aborde Prisma real, considerar errores de dominio tipados en vez de `Error` genérico para mapear códigos HTTP correctos.
3. **`main.ts` línea 68**: `void exercises.save(...)` es una promesa top-level sin `await` ni manejo de error — funciona porque `InMemoryExerciseRepository` resuelve síncronamente en la práctica, pero es frágil si el orden de arranque cambia. Sugerido: envolver el bootstrap en una función `async` explícita.
4. **`AnswerController.tryComposeNextExercise`**: el `catch` genérico trata cualquier error de `SelectNextExerciseUseCase` como "sin ejercicios disponibles" (flujo 2b, decisión deliberada y documentada), pero también silenciaría un fallo real de infraestructura sin dejar rastro. Revisar cuando exista logging/telemetría real.
5. **Sin hallazgos** en naming, SOLID ni complejidad: Controllers delgados sin lógica de negocio (regla 8 cumplida), Use Cases dependen de puertos/interfaces (Dependency Inversion correcta), convenciones de nombres consistentes con el resto del proyecto.

**Decisión tomada**: ninguno de los 4 hallazgos es bloqueante ni de seguridad (eso lo cubre la pasada de Security, por separado) — quedan documentados como deuda técnica menor, no corregidos en esta pasada (Reviewer no modifica código, per sus propias Restricciones).

**Output generado**: esta entrada. `.ai/prompts/reviewer.md` (cabecera corregida de "# Test Agent" a "# Reviewer Agent").
