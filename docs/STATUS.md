# Estado del Proyecto

> Documento vivo — se actualiza libremente según avanza el trabajo. No es un ADR: no registra decisiones estables, solo progreso. Para decisiones, ver [ADR-000](ADR-000_Estructura.md) y siguientes.

## Pendientes Prioritarios

### 1. ~~DOMAIN.md~~ ✅

Completado como [ADR-004_domain.md](ADR-004_domain.md).

### 2. ~~ADR-005 Adaptive Difficulty Engine~~ ✅

Completado como [ADR-005](ADR/ADR-005-adaptive-difficulty-engine.md).

### 3. ~~math-topics.md~~ ✅

Completado como [ADR-006_math_topics.md](ADR/ADR-006_math_topics.md).

### 4. ~~User Stories~~ ✅

Completadas en [docs/user-stories/](user-stories/). US-003 renombrada a "Iniciar Sesión de Entrenamiento" para no confundirse con US-002 Login. US-007 quedó sin caso de uso asignado — pendiente añadir UC-007 al definir Casos de Uso (#5).

### 5. ~~Casos de Uso~~ ✅

Completados en [docs/use-cases/](use-cases/). UC-001 original se dividió en UC-001 (Generate Exercise, Batch/IA) y UC-008 (Select Next Exercise, tiempo real/determinista). Se añadió UC-007 (Get User Statistics) para cerrar el hueco de US-007.

### 6. ~~Línea Base de Seguridad~~ ✅

Completada como [ADR-012_linea_base_seguridad.md](ADR/ADR-012_linea_base_seguridad.md), referenciada desde `.ai/AGENTS.md`. Sustituye a un paquete inicial de 5 ADR (`docs/ADR/Security/`, eliminado) que modelaba una postura de seguridad de plataforma en producción (Vault, RBAC formal, Zero Trust) desproporcionada para el estado actual del proyecto y centrada en proteger a los agentes de desarrollo entre sí en vez del producto. ADR-012 cubre en su lugar lo aplicable ahora: gestión de secretos, prompt injection acotado a UC-001/UC-003, protección de datos de menores (relevante por `AcademicLevel.Primaria`), y regla mínima de contraseñas.

## Estado Actual

| Área | Estado |
|---|---|
| Visión Producto | ✅ 100% |
| Arquitectura | ✅ 95% |
| Monorepo | ✅ 95% (scaffolding creado, `npm install` y `turbo typecheck` verificados en verde — 13/13 tareas) |
| Sistema Multiagente | ✅ 95% |
| Documentación | ✅ 90% |
| Dominio | ✅ 100% diseño + contratos de repositorio materializados como TS real en `packages/shared-domain` (VOs, entidades, 5 repositorios) |
| Casos de Uso | ✅ 100% (UC-001 a UC-010 — UC-009 Register y UC-010 Login añadidos, huecos detectados al construir el backend real) |
| Seguridad | ✅ 100% línea base (ADR-012) **implementada**: hash bcrypt real, JWT real, mensajes de login genéricos, verificación de autorización (IDOR) en los 3 Casos de Uso que operan sobre una `Session` existente. RBAC/Vault/Zero Trust diferidos deliberadamente, ver "Fuera de alcance" del ADR |
| Contratos IA | ✅ 100% forma de datos (DTOs API + contrato Qwen) materializada como TS real, con validación en tiempo de ejecución (Zod, ADR-001 adenda 2026-08-06) ya implementada en `QwenClient` |
| Modelo de Datos Físico | ✅ 100% [ADR-013](ADR/ADR-013_modelo_datos_fisico.md) + `database/schema.prisma` real, verificado con `prisma validate`/`generate`; faltan migraciones reales e implementaciones de repositorio |
| Infraestructura (Database/API/LLM) | ✅ **API real y verificada end-to-end** (Controllers + rutas Express + middleware de auth, `npx tsx src/presentation/main.ts` + `curl` a través de registro→login→sesión→respuesta→estadísticas). ⚠️ Database sigue en esqueleto (`declare class`): 5 `Prisma*Repository` — el servidor arranca hoy con repositorios en memoria (`packages/shared-testing`), sin persistencia real entre reinicios. **LLM real**: `QwenClient` + `QwenHintGenerator` (TDD, 5/5 y 2/2). **Auth real**: `BcryptPasswordHasher`/`JwtTokenIssuer`, testeados de verdad (sin red, a diferencia de `LangChainQwenModel`/Prisma). |
| Implementación | ✅ 65% — `AdaptiveDifficultyEngine` (8/8) + 9 Casos de Uso (UC-001 a UC-010) + 5 Controllers + middleware de auth + 2 adaptadores de auth reales, todo TDD Red→Green. 83 tests verdes entre `backend-api` (73) y `ai-engine` (10). Backend arrancable y probado manualmente de punta a punta. Falta: `Prisma*Repository` real (Database, requiere Postgres vivo). |
| Git / Repositorio remoto | ✅ Inicializado, commit inicial en `main`, push a `https://github.com/RAOMG-IA/mathMindIA.git` verificado. |

## Próximo Paso Recomendado

1. ~~DOMAIN.md~~ ✅
2. ~~ADR-005 Adaptive Difficulty Engine~~ ✅
3. ~~math-topics.md~~ ✅
4. ~~User Stories~~ ✅
5. ~~Casos de Uso~~ ✅
6. ~~Scaffolding de `apps/`+`packages/`~~ ✅ (npm workspaces + Turborepo, solo tooling/estructura — ver `.ai/prompts/architecture.md`)
7. ~~`npm install` + `turbo typecheck`~~ ✅ (13/13 tareas correctas tras corregir `langchain` a `^1.5.0` — la versión `^0.3.0` inicial chocaba con `@langchain/core` 1.x)

10. ~~Decidir librería de navegación para `mobile-app`~~ ✅ Expo Router — registrado en [ADR-001](ADR-001_LenguajesMetodologias.md), `apps/mobile-app/app/` con enrutado por archivos.
11. ~~Línea Base de Seguridad~~ ✅ [ADR-012](ADR/ADR-012_linea_base_seguridad.md), sustituye al paquete `docs/ADR/Security/` eliminado.
12. ~~Contratos de repositorio~~ ✅ `packages/shared-domain/src/{value-objects,entities,repositories}` — TypeScript real (sin lógica), verificado con `turbo typecheck`/`lint`. `email` añadido a `User` (hueco detectado al tipar `findByEmail`).
13. ~~Contratos de frontera (DTOs API + contrato Qwen)~~ ✅ `packages/shared-types/src/dtos` (7 DTOs) y `apps/ai-engine/src/prompts` (GenerateExercise/GenerateHint). `ExercisePublicDto` excluye `correctAnswer`/`explanation`/`difficulty` deliberadamente. Hueco detectado: `hintsUsed` necesita contador efímero (Redis) antes de que exista `Answer` — no resuelto, documentado en `Hint.ts`. Validación en tiempo de ejecución del contrato Qwen sigue pendiente (librería sin decidir).
14. ~~Modelo de Datos Físico~~ ✅ [ADR-013](ADR/ADR-013_modelo_datos_fisico.md) — hueco detectado por el usuario al revisar US-001 (no había esquema ni ORM ratificado). Prisma confirmado. `database/schema.prisma` verificado con `prisma validate`/`generate` reales.
15. ~~Tests de `AdaptiveDifficultyEngine`~~ ✅ (TDD Red) `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts` — 8 casos, valores calculados a mano contra ADR-005, trazados a US-004. Hueco real detectado y documentado en ADR-005: el K provisional (cold start) necesita un contador de intentos por nivel que no existe en `User` — diferido.
16. ~~Implementación de `computeNextDifficulty`~~ ✅ (TDD Green) Primer ciclo TDD completo del proyecto. `vitest run` → 8/8 en verde a la primera. Hueco preexistente detectado y corregido de paso: `turbo run test` fallaba en toda regla para paquetes sin tests (`vitest run` sale con código 1 sin tests) — se añadió `--passWithNoTests` a los 8 `package.json` con script `test`.
17. ~~Revisión de `.ai/skills/*.md`~~ ✅ 5 hallazgos, todos resueltos: rutas `ARCHITECTURE.md` mal escritas, referencia a ADR-012 añadida a las 11 skills, solape architecture/documentation aclarado, ejemplos de `knowledge-manager.md` sincronizados con el código real. (El punto de `reviewer.md` asumiendo flujo PR quedó resuelto de facto al inicializar git — ver #18.)
18. ~~Git inicializado + push a GitHub~~ ✅ `git init`, remote `origin` → `https://github.com/RAOMG-IA/mathMindIA.git`, commit inicial (158 archivos, verificado sin secretos), `push -u origin main` confirmado en el remoto.
19. ~~Esqueletos de Infrastructure (Database/API/LLM)~~ ✅ (`declare class`, sin lógica) `Prisma*Repository` (5), `*Controller` (5), `QwenClient`. Impedimento real señalado antes de generarlos: faltan Casos de Uso implementados y sus Tests — la implementación real de estas clases sigue bloqueada hasta entonces.
20. ~~Primer Caso de Uso completo: UC-002 + UC-004~~ ✅ (TDD Red→Green) `UpdateDifficultyUseCase` (UC-004, wrapper de orquestación sobre `computeNextDifficulty`) y `ValidateAnswerUseCase` (UC-002, invoca UC-004), elegidos por el usuario vía AskUserQuestion sobre UC-005/UC-008. 8/8 tests verdes con `InMemory{Session,Exercise,Answer,User}Repository` + `FixedClock`/`SequentialIdGenerator` (`packages/shared-testing/src/mocks`, antes vacío). Huecos de dominio detectados y resueltos al tipar: `Exercise.timer: Timer` (materialización de un hueco ya asumido en ADR-004), `INITIAL_RATING` (Difficulty por defecto), puertos `IdGenerator`/`Clock` nuevos en `packages/shared-domain/src/ports`.
21. ~~UC-007 Get User Statistics~~ ✅ (TDD Red→Green) `GetUserStatisticsUseCase`, elegido tras descartar UC-003 (bloqueado por el hueco ya documentado de `hintsUsed`/contador efímero) y UC-006 (necesitaría decidir cómo trackear la variación de `userRating` desde el inicio de sesión, hueco de diseño no resuelto). Agregación por Tema (ADR-006) con `MIN_ATTEMPTS_PER_TOPIC=3`/`TOP_N=3` como constantes documentadas (el propio UC delega esos umbrales "a definir al implementar"). 3/3 tests verdes, sin dependencia de `SessionRepository` (el contrato `AnswerRepository.findByUserId` ya resuelve el join como responsabilidad de infraestructura).
22. ~~UC-003 Generate Hint + UC-006 End Session~~ ✅ (TDD Red→Green) Los dos huecos de diseño pendientes de #21 se resolvieron por indicación explícita del usuario ("avanza con UC3 y UC6"): `Session.ratingAtStart: Difficulty` (snapshot al crear la sesión, mismo patrón que `Exercise.timer` — cierra el hueco de "variación de rating" de UC-006) y el puerto `HintUsageTracker` en `packages/shared-domain/src/ports` (contador efímero sesión+ejercicio, cierra el hueco de `hintsUsed`/UC-003, ya anticipado en la nota de diseño de `packages/shared-types/src/dtos/Hint.ts`). `GenerateHintUseCase` depende de un puerto local `HintGenerator` (no de `apps/ai-engine` directamente — son apps/cajas separadas por ARCHITECTURE.md); la implementación real (adaptador a `QwenClient`) sigue diferida, mismo patrón que Prisma/controllers. 10/10 tests verdes. Nuevos dobles: `InMemoryHintRepository`, `InMemoryHintUsageTracker`.
23. ~~UC-005 Start Session + UC-008 Select Next Exercise~~ ✅ (TDD Red→Green) Último hueco de diseño pendiente resuelto: entidad `Tema` + `TemaRepository` (catálogo de referencia de ADR-006, sin `save` — se puebla por seed/migración, no por un Caso de Uso). `SelectNextExerciseUseCase` consulta banda ±150 (ADR-005) y amplía a ±300 solo si viene vacía; selecciona el candidato de `difficulty` más cercano al `userRating` (judgment call documentado, el UC no fija algoritmo). `StartSessionUseCase` compone la implementación real de `SelectNextExerciseUseCase`. 11/11 tests verdes. Con esto, **los 6 Casos de Uso de `application/use-cases/README.md` quedan completos**.

24. ~~QwenClient real + adaptador HintGenerator~~ ✅ (TDD Red→Green) Primera pieza de Infrastructure con implementación real, no esqueleto. Decisiones confirmadas por el usuario vía AskUserQuestion: transporte backend-api↔ai-engine por **import directo in-process** (no HTTP — ARCHITECTURE.md nunca especifica transporte y no hay evidencia de despliegue independiente en este TFM), **Zod** para validación de forma del output de Qwen (registrado como adenda en ADR-001, mismo patrón que Expo Router), alcance **QwenClient + adaptador** (no solo el cliente aislado). Puerto nuevo `ChatModel` (`apps/ai-engine/src/llm`) desacopla `QwenClient` de LangChain concreto — permite TDD sin red real (5/5 tests). `LangChainQwenModel` (implementación real de `ChatModel`, envuelve `ChatOpenAI`) queda sin tests automáticos, gap aceptado explícitamente. Hueco detectado al construir el adaptador: el puerto `HintGenerator` no llevaba `previousHints` pese a que UC-003 documenta "pistas progresivas" (US-005) — corregido en `GenerateHintUseCase` (recopila pistas previas vía `HintRepository` antes de generar), 1 test nuevo. `QwenHintGenerator` (adaptador real, `apps/backend-api/src/infrastructure/ai`) 2/2 tests con fake estructural de `QwenClient`. UC-001 (Generate Exercise Batch) sigue sin Caso de Uso — `QwenClient.generateExercise` ya está listo y testeado para cuando se aborde.

Con el primer ciclo Red→Green completo, el patrón queda establecido para el resto de lógica de negocio (casos de uso, resto de servicios de dominio): User Story + AC → Tests (Test Agent) → Implementación (Developer Agent), cada fase con confirmación explícita del usuario antes de avanzar a la siguiente. Los Casos de Uso de Application (#20-23) confirman que el patrón también funciona a nivel de orquestación (no solo lógica de dominio pura), y que los huecos de diseño detectados y diferidos pueden resolverse en una iteración posterior sin tener que replantear lo ya construido. #24 confirma que el mismo patrón TDD funciona también para Infrastructure real (no solo Application/Domain), con la particularidad de que el adaptador que habla con la red real (`LangChainQwenModel`) queda deliberadamente fuera de la cobertura automática.

25. ~~API REST (mapeo de rutas)~~ ✅ `ARCHITECTURE.md` ("API REST (Rutas)") — una ruta por DTO existente, mapeada a los 5 Controllers ya declarados. El usuario pidió inicialmente una User Story para esto; se señaló el desajuste con `docs/user-stories/README.md` (las User Stories no incluyen diseño técnico) y se resolvió como tarea del Architecture Agent en su lugar. 2 huecos de contrato corregidos (`RequestHintRequestDto.elapsedMs`, `SessionController.startSession(userId, ...)`) y 1 hueco de autorización (IDOR: `EndSessionUseCase`/`ValidateAnswerUseCase`/`GenerateHintUseCase` no verifican dueño de la `Session`) documentado como requisito explícito para cuando se implementen los Controllers reales.
26. ~~UC-001 Generate Exercise (Batch)~~ ✅ (TDD Red→Green) `GenerateExerciseBatchUseCase` (`apps/ai-engine/src/batch/`) — cierra el último Caso de Uso pendiente. Usa `QwenClient.generateExercise` (ya listo), reintenta hasta `MAX_ATTEMPTS=3` (judgment call documentado, el UC no fija N) si el resultado viola las invariantes de `Exercise` (ADR-004: `type='Test'` ⇒ exactamente 3 opciones y `correctAnswer` incluida), `difficulty` inicial = punto medio del `difficultyRange` del Tema para ese nivel (ADR-006), `timer.limitMs` fijo en 15s (placeholder documentado — ningún ADR/UC fija el límite de tiempo de un ejercicio generado por IA). Paso 1 del UC (elegir qué Tema/nivel tiene escasez) queda explícitamente fuera — llega resuelto como input, decidido por un scheduler todavía sin construir (mismo criterio que UC-008 flujo 2b). 5/5 tests verdes. `apps/ai-engine/src/batch/README.md` corregido (referenciaba UC-003 incorrectamente, esa generación vive en `backend-api`).

**Con esto, los 7 Casos de Uso originales de STATUS.md están completos** (UC-001 a UC-008, con la división ya conocida UC-001/UC-008 y el UC-007 añadido para US-007).

27. ~~Backend real: Controllers + rutas Express + auth~~ ✅ (TDD Red→Green) El usuario pidió "comenzamos con el backend" — construir los Controllers reales + Express siguiendo el mapa de #25. Cadena de huecos detectados y resueltos, cada uno surgido al construir el siguiente consumidor real (mismo patrón de toda la sesión):
    - **UC-009 Register / UC-010 Login**: US-001/US-002 nunca tuvieron Caso de Uso asignado (mismo motivo que UC-007) — cerrado antes de poder implementar `AuthController`.
    - **Puertos nuevos**: `PasswordHasher`/`TokenIssuer` (`packages/shared-domain/src/ports`) + entidad `UserCredentials`/`UserCredentialsRepository` (credenciales deliberadamente fuera del agregado `User`, decisión ya fijada en ADR-004).
    - **`SEED_RATING_BY_LEVEL` corregido**: `INITIAL_RATING` (constante plana en 1200) ignoraba que ADR-005 fija semillas *distintas* por nivel (Primaria 800, Secundaria 1200, Bachillerato 1600, Ingeniería 2000) — bug real, no solo un hueco; sembrar el rating correcto al registrarse lo sacó a la luz. Los 4 consumidores (`ValidateAnswerUseCase`, `EndSessionUseCase`, `SelectNextExerciseUseCase`, `StartSessionUseCase`) actualizados; ningún test existente cambió de resultado (todos usaban `Secundaria`, cuya semilla coincide con el valor plano anterior).
    - **Hueco IDOR corregido**: `EndSessionUseCase`/`ValidateAnswerUseCase`/`GenerateHintUseCase` ganan `userId` en su input y verifican `session.userId === input.userId`, señalado en #25 y cerrado aquí con 3 tests nuevos.
    - **`Session.topic` añadido**: al construir `AnswerController` (compone UC-008 tras cada respuesta, "a nivel de contrato HTTP" según el propio DTO) se detectó que `Session` no guardaba `topic` — sin eso, UC-008 no podía seguir sirviendo ejercicios del mismo tema tras el primer ejercicio. `StartSessionUseCase` actualizado para persistirlo.
    - **`HintUsageTracker.get` añadido**: `AnswerController` necesita leer `hintsUsed` sin incrementar (para no confiar en el cliente) — el puerto solo tenía `incrementAndGet`.
    - **`GetUserStatisticsUseCase` ampliado**: `GetUserStatisticsResponseDto` exige `area` (por tema) y `academicLevel` (nivel actual, no el mapa completo de ratings) que el Caso de Uso no producía — se añadió `TemaRepository` como dependencia nueva para resolver `area`.
    - **5 Controllers reales**: `AuthController`, `SessionController`, `AnswerController` (compone `ValidateAnswerUseCase`+`SelectNextExerciseUseCase`, omite `nextExercise` sin fallar toda la respuesta si el pool está agotado — flujo 2b), `HintController`, `StatisticsController`.
    - **`BcryptPasswordHasher`/`JwtTokenIssuer`**: a diferencia de `LangChainQwenModel`/Prisma, son cómputo puro (sin red) — **sí** tienen cobertura de test completa (bcrypt real, jsonwebtoken real, incluyendo tokens expirados/con secreto distinto).
    - **`authMiddleware`**: `extractBearerToken` (función pura) + `createAuthMiddleware`, testeados con objetos Request/Response mínimos, sin servidor real.
    - **`routes.ts`/`main.ts`**: wiring puro (sin tests automáticos, mismo criterio que Prisma/LangChain) — verificado **manualmente arrancando el servidor** (`npx tsx src/presentation/main.ts`) y probando con `curl` el flujo completo: registro → login → iniciar sesión → responder (Elo real aplicado, rating cambió de 800.00 a 805.36) → finalizar sesión → estadísticas → 401 sin token.
    - `main.ts` usa repositorios en memoria (`packages/shared-testing`) porque `Prisma*Repository` sigue en esqueleto — el servidor arranca y funciona de verdad, pero sin persistencia entre reinicios; documentado explícitamente en el propio archivo.

    83 tests verdes (73 `backend-api` + 10 `ai-engine`), `npx turbo run typecheck lint test` → 31/31 tareas en verde.

**Siguiente paso lógico**: `Prisma*Repository` real (Database) — requiere Postgres vivo (`docker-compose`, todavía sin crear) y migraciones reales (`npm run db:migrate`). Es el único bloque de Infrastructure que queda como esqueleto; con eso el backend tendría persistencia real y el TFM cerraría su columna vertebral técnica completa (dominio → aplicación → infraestructura → presentación, de punta a punta, con TDD en cada capa que no depende de infraestructura externa).
