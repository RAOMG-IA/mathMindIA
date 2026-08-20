# Reviewer Agent
Review code quality, architecture compliance, complexity and SOLID principles.

---

---
task_id: STATUS-028
date: 2026-08-07
agentes: [reviewer]
flujo: [developer, reviewer, security, documentation]
artefactos: [apps/backend-api/src/presentation/http/routes.ts, apps/backend-api/src/presentation/main.ts, apps/backend-api/src/presentation/http/AnswerController.ts]
estado: done
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

---

---
task_id: STATUS-063
date: 2026-08-21
agentes: [reviewer]
flujo: [product, architecture, test, developer, reviewer, security, documentation]
artefactos: [apps/backend-api/src/application/use-cases/GuestLoginUseCase.ts, apps/backend-api/src/presentation/http/AuthController.ts, apps/backend-api/src/presentation/http/routes.ts, apps/backend-api/src/presentation/main.ts, apps/mobile-app/src/api/fetchClient.ts, apps/mobile-app/src/api/hooks/useAuth.ts, apps/mobile-app/src/screens/LoginScreen.tsx]
estado: done
---

## 2026-08-21 — US-009 "Prueba sin registrarte" (GuestLoginUseCase + endpoint + botón)

**Input**: El usuario (Project Director) pidió pasar Reviewer y Security sobre la implementación de US-009 antes de comitear, si no hay objeciones.

**Contexto utilizado**: `.ai/skills/reviewer.md` (checklist: naming, arquitectura respetada, complejidad razonable, SOLID), `docs/user-stories/US-009-acceso-invitado.md`, `ADR-004`/`ADR-012`. Alcance: `GuestLoginUseCase` (nuevo), `AuthController`/`routes.ts`/`main.ts` (extendidos), `fetchClient.ts`/`useAuth.ts`/`LoginScreen.tsx` (mobile-app).

**Hallazgos**:
1. **No bloqueante — `GuestLoginUseCase.execute` reintenta ante cualquier error, no solo email duplicado**: el único motivo realista de fallo es colisión de email (password/academicLevel siempre válidos por construcción propia), pero un error de infraestructura real (p. ej. fallo de conexión a base de datos) también dispararía hasta 5 reintentos silenciosos antes de propagarse, en vez de fallar rápido. Mitigación considerada (error tipado para distinguir "duplicado" de otras causas) y descartada: el propio `RegisterUseCase` ya usa `Error` genérico sin clase propia en todo el proyecto (confirmado por grep, ningún caso de uso existente introduce error tipado) — introducir uno aquí rompería la consistencia con el resto de la base de código para un caso de baja probabilidad real. Queda documentado como deuda técnica aceptada, no corregido.
2. **Sin hallazgos** en naming (`deriveGuestNumber`/`GuestLoginUseCase`/`GUEST_ACADEMIC_LEVEL` consistentes con el resto del proyecto), arquitectura (Controller sigue delgado, `GuestLoginUseCase` compone `RegisterUseCase` en vez de duplicar su lógica, `AuthController` sigue sin conocer Express — la IP se extrae en `routes.ts` y se pasa como primitivo), complejidad (bucle de reintento simple, sin anidamiento) ni SOLID (Single Responsibility respetado: la generación de datos de invitado vive separada de la lógica de alta real).

**Decisión tomada**: el hallazgo #1 no es bloqueante — pasa a Security para su propia valoración, sin cambios de código en esta pasada (Reviewer no modifica código, per sus Restricciones).

**Output generado**: esta entrada.
