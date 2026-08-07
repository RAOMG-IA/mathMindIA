# Developer Agent
Implement only after tests exist. Follow TDD and Clean Architecture.

---

## 2026-08-06 — Implementación de computeNextDifficulty (TDD Green)

**Input**: Confirmación del usuario para implementar `computeNextDifficulty` tras el Red de 8/8 tests fallidos (Test Agent, fase previa). Primera activación del Developer Agent en el proyecto.

**Contexto utilizado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts` (8 tests con valores calculados a mano, la especificación real a satisfacer), docs/ADR/ADR-005-adaptive-difficulty-engine.md (fórmulas 1-5), restricción de la skill ("Debe respetar Clean Architecture, Contratos existentes, Casos de uso definidos" — función pura sin I/O ni dependencias de framework).

**Decisión tomada**: Implementación directa de las 5 fórmulas de ADR-005 (`computeExpectedScore`, `computeActualScore` con clamp, `computeK` con tope de racha, actualización simétrica de `userRating`/`exerciseRating`), reemplazando el `declare function` de la fase Red. `K_base` fijo en 32 (K provisional/cold start sigue diferido, ver nota en ADR-005).

**Problema real encontrado y corregido de paso**: al ejecutar `turbo run test` por primera vez en todo el monorepo (no solo el paquete tocado), los paquetes sin tests todavía fallaban con `No test files found, exiting with code 1` — habría roto el pipeline de test para cualquiera que lo ejecutara en la raíz. Corregido añadiendo `--passWithNoTests` (flag real de vitest, verificado con `--help`) a los 8 `package.json` con script `test`.

**Output generado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.ts` (implementación completa). Verificado: `vitest run` → **8/8 tests en verde** (primer intento, sin necesitar ajustes — los cálculos a mano de la fase Red coincidieron). `npx turbo run typecheck lint test`: todo en verde en los 12-22 paquetes según la tarea.

---

## 2026-08-06 — Implementación de UpdateDifficultyUseCase y ValidateAnswerUseCase (TDD Green)

**Input**: Confirmación del usuario ("si") para implementar tras el Red de 8/8 tests fallidos (Test Agent, fase previa). Primer Caso de Uso de Application completo del proyecto.

**Contexto utilizado**: `UpdateDifficultyUseCase.test.ts` y `ValidateAnswerUseCase.test.ts` (especificación real a satisfacer), `computeNextDifficulty` (ya implementado, no se repite la fórmula), contratos de `packages/shared-domain/src/repositories` y `src/ports`.

**Decisión tomada**: `UpdateDifficultyUseCase` depende solo de `ExerciseRepository` (recibe `userRating` como parámetro en vez de recargar el `User`, evitando doble fetch/escritura con `ValidateAnswerUseCase`) — persiste el lado `Exercise` y devuelve `nextUserRating` a quien la invoque. `ValidateAnswerUseCase` orquesta `Session`→`Exercise`→`User`, deriva el timeout (flujo 1a) de `responseTimeMs >= exercise.timer.limitMs` sin campo de input nuevo, y hace una única escritura de `User` (streak + rating) tras recibir `nextUserRating` de `UpdateDifficultyUseCase`.

**Output generado**: `apps/backend-api/src/application/use-cases/{UpdateDifficultyUseCase,ValidateAnswerUseCase}.ts` (implementación completa, reemplaza el `declare class` de la fase Red). Verificado: `vitest run` → **8/8 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo.

---

## 2026-08-06 — Implementación de GetUserStatisticsUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 3/3 tests fallidos (Test Agent, fase previa) — el usuario ya había delegado el ciclo completo ("vamos con lo que indicas").

**Contexto utilizado**: `GetUserStatisticsUseCase.test.ts` (especificación real a satisfacer, incluye el caso límite del umbral `MIN_ATTEMPTS_PER_TOPIC`), contratos `UserRepository`/`AnswerRepository`/`ExerciseRepository` ya existentes.

**Decisión tomada**: agregación en un `Map<TemaCode, TopicAccumulator>` en una sola pasada sobre las `Answer` del usuario (con cache de `Exercise` por id para no repetir `findById`), fortalezas/debilidades como los `topics` que superan `MIN_ATTEMPTS_PER_TOPIC` ordenados por `accuracy` (desc/asc) y recortados a `TOP_N`. Usuario inexistente lanza error (mismo criterio que `ValidateAnswerUseCase`).

**Output generado**: `apps/backend-api/src/application/use-cases/GetUserStatisticsUseCase.ts` (implementación completa). Verificado: `vitest run` → **3/3 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo.

---

## 2026-08-06 — Implementación de EndSessionUseCase y GenerateHintUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 10/10 tests fallidos (Test Agent, fase previa) — mismo patrón de delegación que las iteraciones anteriores.

**Contexto utilizado**: `EndSessionUseCase.test.ts` y `GenerateHintUseCase.test.ts` (especificación real a satisfacer), puertos `Clock`/`HintUsageTracker`/`IdGenerator` y `Session.ratingAtStart` ya materializados.

**Decisión tomada**: `EndSessionUseCase` calcula el resumen directamente sobre las `Answer` de la sesión (sin más dependencias que `AnswerRepository`), compara el rating actual del usuario contra `session.ratingAtStart` para la variación, y hace un único `save` de la `Session` con `endedAt`. `GenerateHintUseCase` valida sesión activa → ejercicio existente → `type === 'Resolution'` → tiempo expirado, en ese orden; usa `HintUsageTracker.incrementAndGet` para obtener `order` antes de decidir si reutiliza (`HintRepository.findByExerciseIdAndOrder`) o genera (`HintGenerator.generate` + `save`).

**Output generado**: `apps/backend-api/src/application/use-cases/{EndSessionUseCase,GenerateHintUseCase}.ts` (implementación completa). Verificado: `vitest run` → **10/10 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo, 21/21 tests en `backend-api` (5 Casos de Uso ya implementados).

---

## 2026-08-06 — Implementación de SelectNextExerciseUseCase y StartSessionUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 11/11 tests fallidos (Test Agent, fase previa). Completa el set de 6 Casos de Uso listados en `application/use-cases/README.md`.

**Contexto utilizado**: `SelectNextExerciseUseCase.test.ts` y `StartSessionUseCase.test.ts` (especificación real a satisfacer), `TemaRepository`/`Tema` ya materializados, `ExerciseRepository.findByDifficultyBand` (contrato ya existente, sin cambios).

**Decisión tomada**: `SelectNextExerciseUseCase` consulta banda estrecha (±150) y solo si viene vacía consulta banda ampliada (±300) — evita una consulta redundante cuando la banda estrecha ya tiene resultados; selecciona con `reduce` el candidato de `difficulty` más próximo al `userRating`. `StartSessionUseCase` valida Tema→AcademicLevel antes de tocar cualquier repositorio de escritura (falla rápido), y compone `SelectNextExerciseUseCase` real para el paso 3 en vez de duplicar su lógica.

**Output generado**: `apps/backend-api/src/application/use-cases/{SelectNextExerciseUseCase,StartSessionUseCase}.ts` (implementación completa). Verificado: `vitest run` → **11/11 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo, **32/32 tests en `backend-api`** — los 6 Casos de Uso de `application/use-cases/README.md` quedan completos.

---

## 2026-08-06 — Implementación de QwenClient, LangChainQwenModel y QwenHintGenerator (TDD Green)

**Input**: Continuación sin pausa tras el Red de 7/7 tests fallidos (Test Agent, fase previa). Primera pieza de Infrastructure con implementación real (no `declare class`) del proyecto.

**Contexto utilizado**: `QwenClient.test.ts`/`QwenHintGenerator.test.ts` (especificación real a satisfacer), `buildGenerateExercisePrompt`/`buildGenerateHintPrompt` + schemas Zod ya creados, `@langchain/openai` instalado (resuelto `1.5.6`, forzó `@langchain/core` de `1.2.4` a `1.2.5` para satisfacer su peer — sin conflicto ERESOLVE).

**Decisión tomada**: `QwenClient.generateExercise`/`generateHint` arman el prompt, invocan `ChatModel.invoke`, y parsean+validan con `schema.parse(JSON.parse(raw))` — cualquier fallo (JSON invalido o forma incorrecta) se propaga como excepción sin capturarla (control de seguridad ante output de IA, ADR-012). `LangChainQwenModel` implementa `ChatModel` envolviendo `ChatOpenAI` de LangChain contra el endpoint OpenAI-compatible de Qwen — **sin tests automáticos**, gap aceptado explícitamente (depende de red real). `QwenHintGenerator` mapea `{exercise, order, previousHints}` a `GenerateHintInput` y delega en `QwenClient.generateHint`, tipado contra `Pick<QwenClient, 'generateHint'>` para permitir fakes estructurales en tests. `apps/ai-engine/src/index.ts` deja de ser un placeholder — exporta `ChatModel`/`QwenClient`/`LangChainQwenModel` para que `backend-api` los consuma como paquete de workspace (`main`/`types` añadidos al `package.json`, antes ausentes).

**Output generado**: `apps/ai-engine/src/llm/{QwenClient,LangChainQwenModel}.ts`, `apps/ai-engine/src/index.ts`, `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts` (implementación completa). Verificado: `vitest run` → **7/7 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 31/31 tareas en verde en todo el monorepo, 5/5 tests en `ai-engine`, 35/35 tests en `backend-api`.

---

## 2026-08-06 — Implementación de GenerateExerciseBatchUseCase (UC-001, TDD Green)

**Input**: Continuación sin pausa tras el Red de 5/5 tests fallidos (Test Agent, fase previa). Último Caso de Uso pendiente — cierra UC-001 a UC-008 completos.

**Contexto utilizado**: `GenerateExerciseBatchUseCase.test.ts` (especificación real a satisfacer), `Tema.academicLevels`/`difficultyRange` (ADR-006), invariante de `Exercise` (ADR-004).

**Decisión tomada**: `MAX_ATTEMPTS=3` (el UC no fija N, judgment call documentado igual que `MIN_ATTEMPTS_PER_TOPIC` en UC-007) y `DEFAULT_TIME_LIMIT_MS=15000` (ningún ADR/UC fija el límite de tiempo de un ejercicio generado por IA — deliberadamente no lo decide Qwen, ver "Estrategia IA" de `ARCHITECTURE.md`, es una regla determinística). `violatesExerciseInvariant` como función pura local (no exportada durante el Red, añadida solo en Green — coherente con la disciplina TDD del resto del proyecto). `difficulty` inicial = punto medio del `difficultyRange` del Tema para el `AcademicLevel` pedido. Bucle de reintento simple (`for` con `continue`), sin backoff ni cola de revisión manual (fuera de alcance, documentado).

**Output generado**: `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts` (implementación completa), `apps/ai-engine/src/batch/README.md` (corregido — referenciaba UC-003 incorrectamente). Verificado: `vitest run` → **5/5 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 31/31 tareas en verde en todo el monorepo, 10/10 tests en `ai-engine`.

---

## 2026-08-07 — Backend real completo: RegisterUseCase/LoginUseCase, 5 Controllers, auth, Express, verificación manual end-to-end

**Input**: continuación sin pausa a través de todos los Red de la sesión "comenzamos con el backend" — el usuario delegó el ciclo completo, mismo patrón que iteraciones anteriores.

**Contexto utilizado**: todos los `.test.ts` escritos en esta sesión (Test Agent), puertos/entidades nuevos ya materializados (`PasswordHasher`, `TokenIssuer`, `UserCredentials`, `Session.topic`, `HintUsageTracker.get`, `SEED_RATING_BY_LEVEL`).

**Decisión tomada**: `RegisterUseCase`/`LoginUseCase` implementados siguiendo UC-009/UC-010 al pie de la letra. Los 5 Controllers son traducción pura DTO↔UseCase, sin lógica de negocio (regla 8 de `ARCHITECTURE.md`) — la única lógica no trivial es `AnswerController.tryComposeNextExercise` (try/catch alrededor de `SelectNextExerciseUseCase`, omite `nextExercise` en vez de fallar toda la petición si el pool está agotado). `BcryptPasswordHasher`/`JwtTokenIssuer` usan las librerías reales (`bcrypt`, `jsonwebtoken`) sin abstracción adicional — a diferencia de `LangChainQwenModel`, sí tienen tests reales porque no dependen de red. `authMiddleware` resuelve `Authorization: Bearer` a `req.userId`, nunca confía en el body. `routes.ts`/`main.ts` son wiring puro (Express Router + composición de dependencias) — sin tests automáticos (necesitarían `supertest`, no incorporado en este alcance), verificados en su lugar **arrancando el servidor de verdad** (`npx tsx src/presentation/main.ts` con `JWT_SECRET` de prueba) y probando con `curl` el flujo completo: registro → login → iniciar sesión → responder (rating cambió de 800 a 805.36, fórmula de ADR-005 aplicada de verdad) → finalizar sesión → estadísticas → 401 sin token. `main.ts` usa repositorios en memoria (`@mathmind/shared-testing`) porque `Prisma*Repository` sigue en esqueleto — documentado explícitamente en el propio archivo como limitación temporal, no como diseño final.

**Output generado**: `apps/backend-api/src/application/use-cases/{RegisterUseCase,LoginUseCase}.ts`, `apps/backend-api/src/presentation/http/{Auth,Session,Answer,Hint,Statistics}Controller.ts`, `apps/backend-api/src/infrastructure/auth/{BcryptPasswordHasher,JwtTokenIssuer}.ts`, `apps/backend-api/src/presentation/http/middleware/authMiddleware.ts`, `apps/backend-api/src/presentation/http/routes.ts`, `apps/backend-api/src/presentation/main.ts` (reescrito, antes solo `/health`). Dependencias nuevas: `bcrypt`, `jsonwebtoken` (+ `@types/*`). Verificado: `npx turbo run typecheck lint test` → **31/31 tareas en verde**, 83 tests (73 `backend-api` + 10 `ai-engine`). Smoke test manual end-to-end exitoso.

---

## 2026-08-07 — Corrección de los 3 hallazgos de Security (fuga de mensajes, política de contraseña, algoritmo JWT)

**Input**: el usuario señaló que Reviewer y Security nunca se habían ejecutado como fases del flujo. Pasadas retroactivas de ambos (ver `.ai/prompts/{reviewer,security}.md`) confirmaron 3 hallazgos de Security sobre el código de autenticación; corregidos aquí con TDD.

**Contexto utilizado**: `.ai/prompts/security.md` (los 3 hallazgos confirmados), código existente de `routes.ts`, `RegisterUseCase.ts`, `JwtTokenIssuer.ts`.

**Decisión tomada**: (1) nuevo `errorMapping.ts` — función pura `mapUseCaseError(error, exposeMessage)`, testeada de verdad (a diferencia de `routes.ts`, que sigue siendo wiring sin tests): `exposeMessage=false` colapsa cualquier error a un mensaje genérico + 403, usado en `/sessions/end`, `/answers`, `/hints` (las tres rutas cuyos Casos de Uso verifican propiedad de una `Session`); `exposeMessage=true` mantiene el comportamiento anterior donde el mensaje es contenido de producto pretendido (registro, login, iniciar sesión, estadísticas). (2) `RegisterUseCase`: `MIN_PASSWORD_LENGTH=8` (OWASP ASVS L1), verificado antes de tocar cualquier repositorio — tests existentes con contraseñas de 1 carácter actualizados a 8+. (3) `JwtTokenIssuer.verify`: `algorithms: ['HS256']` explícito — confirmado con un test que jsonwebtoken ya rechazaba `alg=none` incluso sin el fix (defensa en profundidad, no corrección de una vulnerabilidad explotable hoy).

**Output generado**: `apps/backend-api/src/presentation/http/errorMapping.ts` (nuevo) + `.test.ts` (4 tests), `apps/backend-api/src/presentation/http/routes.ts` (wiring actualizado), `apps/backend-api/src/application/use-cases/RegisterUseCase.ts` + `.test.ts` (1 test nuevo), `apps/backend-api/src/infrastructure/auth/JwtTokenIssuer.ts` + `.test.ts` (1 test nuevo). Verificado: `npx turbo run typecheck lint test` → **31/31 tareas en verde**, 79 tests en `backend-api` (antes 73).