# Test Agent
Create tests before implementation. Produce unit, integration tests, mocks and fixtures.

---

---
task_id: STATUS-043
date: 2026-08-09
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Test de validateRegisterForm (TDD Red)

**Input**: "comenzamos con la definicion de la siguiente pantalla 'Registro'" — segunda pantalla real de `mobile-app`, US-001.

**Contexto utilizado**: `docs/user-stories/US-001-registro.md` (AC: nivel académico obligatorio, mensaje concreto para email ya registrado); `LoginScreen.validation.ts` (mismo patrón, ya establecido); `RegisterRequestDto` (`@mathmind/shared-types`) para derivar el tipo `AcademicLevel` sin depender directamente de `@mathmind/shared-domain`.

**Decisión tomada**: `validateRegisterForm(email, password, academicLevel)` reutiliza `isValidEmail`/`isValidPassword` de `@mathmind/shared-utils` (mismos predicados que `LoginScreen`) y añade un tercer campo obligatorio, `academicLevel` (`null` = sin elegir). 5 tests: caso válido, cada campo inválido por separado, y los tres a la vez.

**Output generado**: `apps/mobile-app/src/screens/RegisterScreen.validation.test.ts`. Verificado: `vitest run` → **falla con "Failed to load url ./RegisterScreen.validation... Does the file exist?"** — Red confirmado por la razón correcta. Implementación (Developer Agent, Green) en la misma sesión.

---

---
task_id: STATUS-040
date: 2026-08-09
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Tests de shared-utils (email/password) y LoginScreen.validation (TDD Red)

**Input**: "vamos a definir la pantalla de login... recuerda añadir la validacion del mail, y las normativa de contraseñas que establece security (si no esta definido añadelo a la capa shared-utils)".

**Contexto utilizado**: `RegisterUseCase.ts` (`MIN_PASSWORD_LENGTH = 8`, OWASP ASVS L1, hallazgo Security 2026-08-07 — política ya existente pero solo como constante local, no reutilizable); `ARCHITECTURE.md` ("shared-utils": "Validation helpers", ejemplo ya anticipado); `packages/shared-utils` (paquete existente, `export {}` sin implementar); US-002 (AC de mensaje de error genérico en login).

**Decisión tomada**: `isValidEmail`/`isValidPassword`+`MIN_PASSWORD_LENGTH` en `@mathmind/shared-utils` (9 tests: 6 de email — formato válido, sin @, sin dominio, con espacios, vacío, doble @; 3 de password — límite exacto, por debajo, por encima), única fuente de verdad para backend (`RegisterUseCase`) y mobile (`LoginScreen`). `validateLoginForm` en `apps/mobile-app/src/screens/LoginScreen.validation.ts` (4 tests) compone esos predicados con texto de error en español — separada de `LoginScreen.tsx` para no depender de `QueryClientProvider`/`renderHook`, mismo criterio que `src/api/requests/*.ts`.

**Output generado**: `packages/shared-utils/src/{email,password}.test.ts`, `apps/mobile-app/src/screens/LoginScreen.validation.test.ts`. Verificado: `vitest run` → los 3 módulos fallan (`Does the file exist?`) — Red confirmado por la razón correcta. Implementación (Developer Agent, Green) en la misma sesión.

---

---
task_id: STATUS-038
date: 2026-08-09
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Test de invalidateStatisticsOnSessionStart (TDD Red)

**Input**: "implementa la funcionalida de tankstack invalidateQueries para limpiar la cache cuando el usuario cambie de nivel o cambie el modo de juego".

**Contexto utilizado**: `StartSessionRequestDto` (único DTO que lleva `mode`/`academicLevel`, `packages/shared-types/src/dtos/Session.ts`) — confirma que `useStartSession` es el único punto donde ese cambio ocurre. `queryKeys.ts` (la key de `statistics` ya centralizada, fase anterior).

**Decisión tomada**: a diferencia del resto de hooks de `src/api` (sin test, ver entradas previas), la propia llamada a `invalidateQueries` sí es testeable si se extrae de `useStartSession` como función standalone que recibe un `QueryClient` — es una clase plana de `@tanstack/query-core`, instanciable y espiable con `vi.spyOn` sin renderizar React. 1 test en `useSession.test.ts` verificando que `invalidateStatisticsOnSessionStart(queryClient)` llama a `queryClient.invalidateQueries({queryKey: queryKeys.statistics})`.

**Output generado**: `apps/mobile-app/src/api/hooks/useSession.test.ts`. Verificado: `vitest run` → **falla con `TypeError: invalidateStatisticsOnSessionStart is not a function`** — Red confirmado por la razón correcta. Implementación (Developer Agent, Green) en la misma sesión.

---

---
task_id: STATUS-037
date: 2026-08-09
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Tests de las funciones de request de src/api (TDD Red)

**Input**: "genera las clases, hook y abstracciones para tanckstack query" — el usuario pidió construir la capa de `src/api` sobre `fetchClient` (ya implementado), cubriendo las 7 rutas de negocio de `openapi.yaml`.

**Contexto utilizado**: ADR-015 (un hook por ruta), `apps/backend-api/openapi.yaml` y los DTOs reales de `packages/shared-types` (`Auth.ts`, `Session.ts`, `Answer.ts`, `Hint.ts`, `Statistics.ts`) para las firmas exactas, `fetchClient.test.ts` (patrón `vi.stubGlobal('fetch', ...)` ya establecido).

**Decisión tomada**: separar la lógica pura (qué ruta/método/body) de los hooks de React — los hooks (`useMutation`/`useQuery`) no son testeables sin `QueryClientProvider`+`renderHook`, tooling ausente en el monorepo. 7 tests en 5 ficheros (`requests/{auth,session,answer,hint}.test.ts` con 2/2/1/1, `statistics.test.ts` con 1) verificando ruta, método y body serializado de cada función `*Request(dto)`.

**Output generado**: los 5 ficheros de test. Verificado: `vitest run` → **los 5 módulos fallan con "Failed to load url ... Does the file exist?"** — Red confirmado por la razón correcta (funciones no implementadas todavía). Implementación (Developer Agent, Green) en la misma sesión.

---

---
task_id: STATUS-035
date: 2026-08-09
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Tests de useSessionStore + fetchClient (TDD Red)

**Input**: "no, comenzamos" — el usuario dio luz verde a implementar lo diseñado en [ADR-015](../../docs/ADR/ADR-015_mobile_app_screens.md), primera pieza real de `mobile-app` de toda la sesión.

**Contexto utilizado**: ADR-015 (persistencia del `sessionToken` vía `TokenStorage` multiplataforma, `fetchClient` con `Authorization: Bearer` salvo `/auth/*`), `apps/backend-api/openapi.yaml` (`LoginResponseDto`/`RegisterResponseDto` solo devuelven `userId`/`sessionToken`, nunca `email`), `errorMapping.ts` (forma real del body de error: `{ error: string }`, no `{ message }`), convención de fakes de `packages/shared-testing` (`InMemory*`) aplicada localmente ya que `TokenStorage` no es un puerto de `shared-domain`.

**Decisión tomada**: 5 tests en `apps/mobile-app/src/store/useSessionStore.test.ts` (arranque sin autenticar, `login` persiste vía `TokenStorage` inyectado, `hydrate` restaura/no restaura sesión, `logout` limpia estado+storage) con un `InMemoryTokenStorage` local. 4 tests en `apps/mobile-app/src/api/fetchClient.test.ts` (`Authorization` presente/ausente según ruta pública, body JSON parseado en éxito, error lanzado con el mensaje real del campo `error`) usando `vi.stubGlobal('fetch', ...)`.

**Output generado**: ambos ficheros de test. Verificado: `vitest run` → **ambos módulos fallan con "Failed to load url ... Does the file exist?"** (los módulos `useSessionStore.ts`/`fetchClient.ts` no existen todavía) — Red confirmado por la razón correcta. Implementación (Developer Agent, Green) en la misma sesión, sin pausa — el usuario ya había dado luz verde a todo el ciclo.

---

---
task_id: STATUS-015
date: 2026-08-06
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Tests de AdaptiveDifficultyEngine (TDD Red)

**Input**: Confirmado con el usuario que los tests del `AdaptiveDifficultyEngine` trazan a US-004 (AC "el siguiente ejercicio refleja la nueva dificultad calculada") y ADR-005 (fórmulas). Primera activación del Test Agent en el proyecto.

**Contexto utilizado**: docs/user-stories/US-004-resolver-ejercicio.md (User Story + AC), docs/ADR/ADR-005-adaptive-difficulty-engine.md (fórmulas exactas, fuente de los valores esperados), .ai/skills/test.md (Entradas requeridas: User Stories + AC + Diseño arquitectónico — las tres ya existían).

**Decisión tomada**: 8 casos de test en `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts`, valores calculados a mano contra las fórmulas de ADR-005 (no aproximados): ratings iguales con acierto/fallo/límite de tiempo, modulación y tope de racha, ratings desiguales en ambas direcciones, y el caso `responseTimeMs > timeLimitMs`. Se materializó la interfaz de ADR-005 como `declare function` (firma real, sin cuerpo) para poder importarla sin escribir lógica productiva (restricción explícita de esta skill). **Hueco de diseño real detectado**: el K provisional (cold start) de ADR-005 necesita un contador de intentos por nivel que no existe en `User` — diferido explícitamente, documentado en ADR-005, los tests cubren `K_base=32` fijo.

**Output generado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.ts` (interfaz + constantes + firma sin implementar) y `AdaptiveDifficultyEngine.test.ts` (8 tests). Verificado: `turbo typecheck` 13/13 en verde; `vitest run` → **8/8 tests fallan con `TypeError: computeNextDifficulty is not a function`** — Red confirmado por la razón correcta (falta implementación), no por error de configuración. Implementación (Developer Agent, fase Green) no ejecutada — pendiente de confirmación aparte del usuario.

---

---
task_id: STATUS-020
date: 2026-08-06
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Tests de UpdateDifficultyUseCase y ValidateAnswerUseCase (TDD Red)

**Input**: Primer Caso de Uso de Application del proyecto. El usuario eligió UC-002 `ValidateAnswerUseCase` (invoca UC-004 `UpdateDifficultyUseCase`) sobre UC-005/UC-008 vía AskUserQuestion, por ser UC-004 un wrapper fino sobre `computeNextDifficulty` ya implementado y testeado.

**Contexto utilizado**: `docs/use-cases/UC-002-validate-answer.md` y `UC-004-update-difficulty.md` (flujo principal/alternativo/postcondiciones), `docs/ADR/ADR-004_domain.md` (forma de `Session`/`Answer`/`User`), `docs/ADR/ADR-005-adaptive-difficulty-engine.md` (mismo caso base ya validado a mano en `AdaptiveDifficultyEngine.test.ts`: rating 1200 vs 1200, streak 0, acierto instantáneo → 1216/1196), huecos de dominio resueltos en la entrada anterior de `architecture.md` (`Exercise.timer`, `INITIAL_RATING`, puertos `IdGenerator`/`Clock`).

**Decisión tomada**: 2 tests para `UpdateDifficultyUseCase` (caso feliz reutilizando el caso ya validado de ADR-005 + guarda de ejercicio inexistente) y 6 para `ValidateAnswerUseCase` (correcta, incorrecta con reset de racha, timeout como incorrecto automático sin campo de input nuevo, sesión inexistente, sesión ya finalizada, ejercicio inexistente). Ambas clases materializadas como `declare class` sin cuerpo (mismo patrón que `computeNextDifficulty` en su fase Red). Dobles de test nuevos en `packages/shared-testing/src/mocks` (`InMemory{Session,Exercise,Answer,User}Repository`, `FixedClock`, `SequentialIdGenerator`) en vez de builders/fixtures (fuera de alcance, mismo patrón de helpers locales que `AdaptiveDifficultyEngine.test.ts`).

**Output generado**: `apps/backend-api/src/application/use-cases/{UpdateDifficultyUseCase,ValidateAnswerUseCase}.ts` (declare class) + `.test.ts` (8 tests), `packages/shared-testing/src/mocks/*.ts` + `src/index.ts` (barrel, antes vacío). Verificado: `turbo typecheck` en verde; `vitest run` → **8/8 tests fallan con `TypeError: ... is not a constructor`** — Red confirmado por la razón correcta. Confirmación del usuario ("si") obtenida antes de pasar a Green.

---

---
task_id: STATUS-021
date: 2026-08-06
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Tests de GetUserStatisticsUseCase (TDD Red)

**Input**: Continuación directa tras cerrar UC-002/UC-004 ("vamos con lo que indicas" — el usuario delega la elección del siguiente Caso de Uso). Se descartó UC-003 (bloqueado por el hueco ya documentado de `hintsUsed`/contador efímero antes de que exista `Answer`) y UC-006 (necesitaría decidir cómo trackear la "variación de userRating desde el inicio de sesión", hueco de diseño no resuelto) en favor de UC-007, de solo lectura y sin huecos de dominio nuevos.

**Contexto utilizado**: `docs/use-cases/UC-007-get-user-statistics.md` (flujo, incluye explícitamente "Fuera de alcance: umbral exacto de mínimo de intentos por tema — se define al implementar"), `docs/ADR/ADR-006_math_topics.md` (agregación por Tema ya prevista), contrato `AnswerRepository.findByUserId` (ya resuelve el join Answer→Session como responsabilidad de infraestructura, evita que este UC dependa de `SessionRepository`).

**Decisión tomada**: `MIN_ATTEMPTS_PER_TOPIC = 3` y `TOP_N = 3` fijados como constantes locales documentadas — umbrales que el propio UC delega explícitamente al momento de implementar. 3 tests: agregación por tema con precisión/tiempo medio y filtrado de fortalezas/debilidades por umbral (un tema con 1 solo intento se excluye aunque tenga accuracy perfecta), usuario sin historial (flujo 2a, resumen vacío sin error), usuario inexistente (guarda).

**Output generado**: `apps/backend-api/src/application/use-cases/GetUserStatisticsUseCase.ts` (declare class) + `.test.ts` (3 tests). Verificado: `turbo typecheck` en verde; `vitest run` → **3/3 tests fallan con `TypeError: GetUserStatisticsUseCase is not a constructor`** — Red confirmado por la razón correcta.

---

---
task_id: STATUS-022
date: 2026-08-06
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Tests de EndSessionUseCase y GenerateHintUseCase (TDD Red)

**Input**: "avanza con UC3 y UC6" — el usuario pide desbloquear explícitamente los dos Casos de Uso descartados en la iteración anterior por huecos de diseño, en vez de seguir difiriéndolos.

**Contexto utilizado**: `docs/use-cases/UC-006-end-session.md` y `UC-003-generate-hint.md` (flujo principal/alternativo), huecos de dominio resueltos en la entrada anterior de `architecture.md` (`Session.ratingAtStart`, puerto `HintUsageTracker`, puerto local `HintGenerator`), `packages/shared-types/src/dtos/Hint.ts` (nombres `hintsUsedSoFar`/`order` ya fijados por el contrato DTO existente, reutilizados en el Output del Caso de Uso).

**Decisión tomada**: `EndSessionUseCase` — 4 tests: resumen con intentos (aciertos/intentos/tiempo medio/variación de rating, `endedAt` fijado vía `Clock`), sesión sin respuestas (flujo alternativo, resumen en cero sin error), sesión inexistente, sesión ya finalizada. `GenerateHintUseCase` — 6 tests: genera y persiste pista nueva, reutiliza pista existente sin invocar `HintGenerator` (fake local en el test, no en `shared-testing` — es un puerto de Application, no de dominio/infra reutilizado), `order` se incrementa en pistas sucesivas, rechaza modo Test (flujo 1a), rechaza si el tiempo no ha expirado, sesión inexistente/finalizada. Nuevos dobles en `shared-testing/src/mocks`: `InMemoryHintRepository`, `InMemoryHintUsageTracker`.

**Output generado**: `apps/backend-api/src/application/use-cases/{EndSessionUseCase,GenerateHintUseCase}.ts` (declare class) + `.test.ts` (10 tests). Verificado: `turbo typecheck` en verde; `vitest run` → **10/10 tests fallan con `TypeError: ... is not a constructor`** — Red confirmado por la razón correcta.

---

---
task_id: STATUS-023
date: 2026-08-06
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Tests de SelectNextExerciseUseCase y StartSessionUseCase (TDD Red)

**Input**: "ok genera uc5 y 8" — último par de Casos de Uso del set original, bloqueados por la ausencia del catálogo de Temas (resuelta en la entrada anterior de `architecture.md`).

**Contexto utilizado**: `docs/use-cases/UC-008-select-next-exercise.md` (banda ±150/±300 ya fijada por ADR-005, no es un judgment call — el algoritmo de selección dentro del resultado filtrado sí lo es, "no fija un algoritmo"), `docs/use-cases/UC-005-start-session.md` (flujo principal/alternativo 1a), `InMemoryTemaRepository` y entidad `Tema` recién creadas.

**Decisión tomada**: `SelectNextExerciseUseCase` — "el más cercano al userRating" como criterio de selección dentro del resultado filtrado (judgment call documentado, igual que `MIN_ATTEMPTS_PER_TOPIC`/`TOP_N` en UC-007). 6 tests: selección dentro de banda estrecha, ampliación de banda (flujo 2a), sin resultados ni en banda ampliada (flujo 2b), rating por defecto (`INITIAL_RATING`) si el usuario no tiene rating para ese nivel, usuario inexistente, forma de salida sin `correctAnswer`/`difficulty`/`explanation`. `StartSessionUseCase` — compone la implementación real de `SelectNextExerciseUseCase` (no un fake, mismo criterio que `ValidateAnswerUseCase`+`UpdateDifficultyUseCase`). 5 tests: creación de `Session` con `ratingAtStart` y primer ejercicio devuelto, Tema inexistente (flujo 1a), Tema que no aplica al `AcademicLevel` elegido (flujo 1a), usuario inexistente, propagación del error de UC-008 cuando no hay ejercicios disponibles.

**Output generado**: `apps/backend-api/src/application/use-cases/{SelectNextExerciseUseCase,StartSessionUseCase}.ts` (declare class) + `.test.ts` (11 tests). Verificado: `turbo typecheck` en verde; `vitest run` → **11/11 tests fallan con `TypeError: ... is not a constructor`** — Red confirmado por la razón correcta.

---

---
task_id: STATUS-024
date: 2026-08-06
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Tests de QwenClient y QwenHintGenerator (TDD Red)

**Input**: Primera implementación real de Infrastructure (no esqueleto) del proyecto. Decisiones ya confirmadas (ver `architecture.md`): import in-process, Zod, alcance QwenClient+adaptador.

**Contexto utilizado**: `apps/ai-engine/src/prompts/{GenerateExercise,GenerateHint}.ts` (contratos ya existentes + schemas Zod añadidos en esta iteración), puerto nuevo `ChatModel` (permite fake sin red real).

**Decisión tomada**: `QwenClient.test.ts` — 5 tests con `FakeChatModel` (devuelve strings canned): `generateHint`/`generateExercise` con salida válida (parseo correcto), salida con forma inválida (Zod lanza), salida no-JSON (`JSON.parse` lanza). Al escribir el adaptador se detectó un hueco real: el puerto `HintGenerator` (`GenerateHintUseCase.ts`) no llevaba `previousHints` pese a que UC-003 documenta pistas progresivas — se corrigió el puerto y `GenerateHintUseCase` (recopila pistas previas vía `HintRepository`), con 1 test nuevo (`GenerateHintUseCase.test.ts` pasa de 6 a 7 tests) y el `FakeHintGenerator` local actualizado. `QwenHintGenerator.test.ts` — 2 tests con un fake estructural de `QwenClient` (`Pick<QwenClient, 'generateHint'>`, sin LangChain real): mapeo correcto de `{exercise, order, previousHints}` a `GenerateHintInput`, propagación de errores.

**Output generado**: `apps/ai-engine/src/llm/{ChatModel,QwenClient}.ts` (declare class QwenClient) + `QwenClient.test.ts` (5 tests); `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts` (declare class) + `.test.ts` (2 tests); `GenerateHintUseCase.ts`/`.test.ts` actualizados. Verificado: `turbo typecheck` en verde; `vitest run` → **7/7 tests fallan por la razón correcta** (`QwenClient`/`QwenHintGenerator is not a constructor`) — Red confirmado.

---

---
task_id: STATUS-026
date: 2026-08-06
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Tests de GenerateExerciseBatchUseCase (UC-001, TDD Red)

**Input**: "cerramos el uc1 y construimos el backend después" — último Caso de Uso pendiente, cierra el set completo (UC-001 a UC-008) antes de abordar los Controllers/rutas reales.

**Contexto utilizado**: `docs/use-cases/UC-001-generate-exercise-batch.md` (flujo principal, flujo alternativo 4a "reintenta, máximo N intentos"), `QwenClient.generateExercise` (ya implementado y testeado), `Tema`/`TemaRepository` (ADR-006, `academicLevels`/`difficultyRange` ya materializados), invariante de `Exercise` (ADR-004: `type='Test'` ⇒ exactamente 3 opciones y `correctAnswer` incluida).

**Decisión tomada**: 5 tests con un `QueuedExerciseGenerator` fake (`Pick<QwenClient, 'generateExercise'>`, respuestas encoladas para simular reintentos): genera y persiste tipo Resolution válido, genera y persiste tipo Test válido, reintenta cuando el primer intento viola la invariante y el segundo es válido (flujo 4a), lanza tras agotar los intentos si ninguno es válido (verificando además que no se persiste nada), lanza si el Tema no aplica al `AcademicLevel` pedido (precondición). Paso 1 del UC (seleccionar Tema con escasez) queda explícitamente fuera — llega como input ya resuelto.

**Output generado**: `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts` (declare class) + `.test.ts` (5 tests). Verificado: `turbo typecheck` en verde; `vitest run` → **5/5 tests fallan con `TypeError: GenerateExerciseBatchUseCase is not a constructor`** — Red confirmado por la razón correcta.

---

---
task_id: STATUS-027
date: 2026-08-07
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-07 — Tests del backend real: IDOR, RegisterUseCase/LoginUseCase, 5 Controllers, adaptadores de auth, authMiddleware

**Input**: "comenzamos con el backend" — sesión larga con múltiples ciclos TDD encadenados, cada uno cerrando un hueco detectado por el anterior (ver `architecture.md`, dos entradas 2026-08-07).

**Contexto utilizado**: `docs/use-cases/UC-009-register.md`/`UC-010-login.md`, puertos nuevos (`PasswordHasher`/`TokenIssuer`/`UserCredentialsRepository`), `ARCHITECTURE.md` "API REST" (mapa de rutas + hueco IDOR ya señalado), DTOs de `packages/shared-types` (forma exacta de request/response por endpoint).

**Decisión tomada**: (1) 3 tests IDOR nuevos (uno por Caso de Uso corregido), reutilizando el patrón de fixtures ya establecido. (2) `RegisterUseCase.test.ts` (3 tests: rating sembrado por nivel — deliberadamente `Primaria` en vez de `Secundaria` para probar que la semilla varía de verdad, contraseña nunca en texto plano, email duplicado) y `LoginUseCase.test.ts` (3 tests, incluyendo comparación textual exacta de que el mensaje de error es idéntico entre "email inexistente" y "contraseña incorrecta"). (3) 5 `*Controller.test.ts` — todos componen las implementaciones reales de sus Casos de Uso (no fakes), mismo criterio que `ValidateAnswerUseCase`+`UpdateDifficultyUseCase`; `AnswerController.test.ts` verifica además que `hintsUsed` se lee de `HintUsageTracker` sin confiar en el cliente, y que el flujo 2b (pool agotado) omite `nextExercise` sin romper la respuesta completa. (4) `BcryptPasswordHasher.test.ts`/`JwtTokenIssuer.test.ts` — sin fakes, librerías reales (cómputo puro, sin red), incluyendo casos de token expirado (`expiresIn: '-10s'`) y firmado con otro secreto. (5) `authMiddleware.test.ts` — `extractBearerToken` como función pura + `createAuthMiddleware` con objetos Request/Response mínimos (sin servidor real).

**Output generado**: `docs/use-cases/UC-009-register.md`, `UC-010-login.md`; `apps/backend-api/src/application/use-cases/{RegisterUseCase,LoginUseCase}.ts` (declare class) + `.test.ts`; `apps/backend-api/src/presentation/http/{Auth,Session,Answer,Hint,Statistics}Controller.ts` (declare class) + `.test.ts`; `apps/backend-api/src/infrastructure/auth/{BcryptPasswordHasher,JwtTokenIssuer}.ts` (declare class) + `.test.ts`; `apps/backend-api/src/presentation/http/middleware/authMiddleware.ts` (declare function) + `.test.ts`. Verificado: `turbo typecheck` en verde; cada bloque confirmado en Red por la razón correcta (`is not a constructor`/`is not a function`) antes de implementar.

---

---
task_id: STATUS-031
date: 2026-08-07
agentes: [test]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-07 — Tests de integración reales de los 6 Prisma*Repository (TDD Red)

**Input**: el usuario eligió "Prisma*Repository real" como siguiente paso tras el informe de avance. Decisión previa confirmada vía AskUserQuestion: tests de integración reales (no gap aceptado como `LangChainQwenModel`), sin Docker (entorno mono-servidor), contra el `DATABASE_URL` real de `.env`.

**Contexto utilizado**: los 6 `declare class` (`PrismaUserRepository`, `PrismaSessionRepository`, `PrismaExerciseRepository`, `PrismaAnswerRepository`, `PrismaHintRepository`, `PrismaUserCredentialsRepository`, esta última nueva), los dobles `InMemory*` de `packages/shared-testing` (semántica de referencia: upsert en `save`, `findByDifficultyBand` por rango, clave compuesta de `Hint`), `database/schema.prisma` (adenda de este mismo día).

**Decisión tomada**: `vitest.integration.config.ts` — proyecto Vitest separado (`include: ['**/*.integration.test.ts']`), excluido explícitamente de `vitest.config.ts` (`exclude`) para que `turbo run test`/`npm test` sigan sin tocar la base de datos. Script `test:integration`, deliberadamente fuera de `turbo.json` (mismo criterio que mantener `LangChainQwenModel` fuera del `test` por defecto: no depender de un recurso externo). Un `.integration.test.ts` por repositorio (23 tests): cada uno crea sus propios ids únicos (`crypto.randomUUID()`) y limpia exactamente lo que creó en `afterEach` (mismo Postgres de desarrollo, sin base de datos separada, tal como pidió el usuario) — no usa `TRUNCATE` para no arrastrar datos reales. Casos cubiertos: round-trip completo, `null` si no existe, semántica upsert (`save` dos veces no duplica), `findByDifficultyBand` (igualdad + rango), `findByExerciseIdAndOrder` (clave compuesta), `findByUserId` de `Answer` (columna desnormalizada, sin JOIN).

---

---
task_id: STATUS-033
date: 2026-08-08
agentes: [test]
flujo: [test, developer]
estado: done
---

## 2026-08-08 — Tests de UC-011 (RAG): IngestKnowledgeBaseUseCase (Red con fakes) + adaptadores reales (Red de integración, 2 bloqueados por pgvector)

**Input**: el usuario pidió implementar UC-011/ADR-014 (ya diseñados, `STATUS.md` #32). Plan aprobado: TDD Red→Green en cada pieza, fakes nuevos en `packages/shared-testing` para los puertos nuevos (`Embedder`, `KnowledgeBaseIndex`, `RagIngestionRepository`, `IngestionFileSystem`).

**Contexto utilizado**: `docs/use-cases/UC-011-ingest-knowledge-base.md` (flujo principal + flujo 2a), `GenerateExerciseBatchUseCase.test.ts`/`QwenHintGenerator.test.ts` (patrón de fake estructural y fixtures ya establecido), `database/schema.prisma` (modelos `RagIngestionRecord`/`RagChunk`).

**Decisión tomada**: `IngestKnowledgeBaseUseCase.test.ts` (5 tests) — dobles nuevos: `FakeEmbedder` (determinista, sin semántica real), `InMemoryKnowledgeBaseIndex` (similitud por solape de palabras, no vectorial — eso lo prueba el adaptador real contra Postgres, no un fake), `InMemoryRagIngestionRepository`, `InMemoryIngestionFileSystem` (simula directorio de entrada/histórico en memoria). Casos: ingesta correcta `.txt`/`.md`, formato no soportado → Error sin bloquear el resto, directorio vacío. Adaptadores reales, tests de integración: `NodeIngestionFileSystem` (directorio temporal real, sin BBDD, 4 tests) y `PrismaRagIngestionRepository`/`PostgresKnowledgeBaseIndex` (contra Postgres real) — estos dos últimos confirmados en Red por la razón correcta (`is not a constructor`), y **tras implementarlos siguen sin poder pasar a Green**: `prisma db push` falla en este entorno porque la extensión `vector` no está instalada (ver `developer.md`), bloqueo ya anticipado en el plan pero que resultó afectar también a `PrismaRagIngestionRepository` (sin columna vectorial) porque `db push` aplica todo el schema de una vez, no tabla a tabla.

**Output generado**: `packages/shared-testing/src/mocks/{FakeEmbedder,InMemoryKnowledgeBaseIndex,InMemoryRagIngestionRepository,InMemoryIngestionFileSystem}.ts`, `apps/ai-engine/src/rag/IngestKnowledgeBaseUseCase.test.ts` (5 tests), `apps/backend-api/src/infrastructure/rag/{NodeIngestionFileSystem,PostgresKnowledgeBaseIndex}.integration.test.ts`, `apps/backend-api/src/infrastructure/repositories/PrismaRagIngestionRepository.integration.test.ts`. Verificado: `npx tsc --noEmit` en verde en `ai-engine`/`packages/shared-testing`/`backend-api`; Red confirmado por la razón correcta en los 3 adaptadores + el Caso de Uso (todos "is not a constructor") antes de implementar.

**Output generado**: `apps/backend-api/vitest.integration.config.ts`, `apps/backend-api/vitest.config.ts` (exclusión), `apps/backend-api/src/infrastructure/repositories/Prisma{User,Session,Exercise,Answer,Hint,UserCredentials}Repository.integration.test.ts` (23 tests). Verificado: `npx tsc --noEmit` en verde; `npm run test:integration` → **6/6 suites fallan con `TypeError: ... is not a constructor`** — Red confirmado por la razón correcta. `npx vitest run` (sin config) confirma que estos ficheros quedan excluidos del run por defecto (79 tests, sin cambios).