# Developer Agent
Implement only after tests exist. Follow TDD and Clean Architecture.

---

## 2026-08-09 — LoginScreen (US-002): validadores, refactor de RegisterUseCase, pantalla real

**Input**: Red confirmado de `shared-utils`/`LoginScreen.validation.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `@tanstack/react-query`'s `useMutation` (`useLogin`, ya implementado); `NeuralLoader`/`BackgroundGrid`/`COLORS` (reexportados para el diseño); `LoginUseCase.ts` (`INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'`, mensaje genérico ya correcto en el backend); `expo-router`'s `useRouter`.

**Decisión tomada**: `isValidEmail` implementado sin regex (`indexOf`/`slice`, no `[^\s@]+@[^\s@]+\.[^\s@]+` — un linter marcó ese patrón por backtracking cuadrático ante input adversarial; con `indexOf` el coste es O(n) sin ambigüedad). `RegisterUseCase` importa `isValidPassword`/`MIN_PASSWORD_LENGTH` de `@mathmind/shared-utils` en vez de su constante local. `LoginScreen.tsx`: mientras `useLogin().isPending`, renderiza `<NeuralLoader/>` en vez del formulario (reutilización real, no solo estética); error de servidor mostrado tal cual (`login.error.message`); sin ruta a `(app)/home` todavía (Expo Router muestra "Unmatched Route" hasta que exista, sin romper nada).

**Problema real encontrado y corregido de paso (2)**:
1. Sin `QueryClientProvider` en el árbol, `useLogin()` habría fallado en cuanto se renderizara de verdad — ningún hook de `src/api` se había montado en un componente real hasta ahora. Añadido a `app/_layout.tsx` (`useState(() => new QueryClient())`).
2. El smoke-test de bundle web (`expo export --platform web`) reveló que `shared-utils`'s barrel (`export * from './validation/email.js'`) rompía Metro (`Unable to resolve module ./validation/email.js`) pese a typecheckear bien bajo `tsc` -- NodeNext (`backend-api`) exige la extensión, Metro no la traduce a `.ts`. `shared-types` usa el mismo patrón sin problema porque sus exports son interfaces (se borran al compilar, nunca llegan a Metro). Resuelto consolidando `shared-utils` en un único fichero `index.ts`, sin imports relativos internos que puedan entrar en conflicto.

**Refactor posterior (misma tarea, a petición del usuario)**: "extrae de los ficheros js las configuraciones css e importalas de sus respectivos ficheros en .src/css/xxx.css" — aclarado primero con el usuario (AskUserQuestion) que React Native no soporta `.css` reales en iOS/Android (solo `StyleSheet.create`, sin loader CSS en Metro para nativo); confirmado extraer a ficheros `*.styles.ts` sidecar en su lugar (`NeuralLoader.styles.ts`, `StatusPill.styles.ts`, `LoginScreen.styles.ts`), misma separación lógica/estilo sin romper ninguna plataforma.

**Output generado**: `packages/shared-utils/src/index.ts` (+2 tests movidos a `email.test.ts`/`password.test.ts`, mismo directorio). `RegisterUseCase.ts` actualizado. `apps/mobile-app/src/screens/{LoginScreen.tsx,LoginScreen.validation.ts,LoginScreen.styles.ts}`, `app/(auth)/login.tsx`, `app/_layout.tsx` actualizado. `NeuralLoader.styles.ts`/`StatusPill.styles.ts` nuevos, `NeuralLoader.tsx`/`StatusPill.tsx` actualizados. `@mathmind/shared-utils` añadido como dependencia de `backend-api` y `mobile-app`. Verificado con bundle real de web dos veces (antes y después del refactor de estilos), montado temporalmente en `app/index.tsx` y revertido. `npx turbo run typecheck lint test` → 32/32 en verde (21/21 tests en `mobile-app`, 9/9 en `shared-utils`, 79/79 en `backend-api` sin cambios de resultado).

---

## 2026-08-09 — Componente `NeuralLoader` (UI pura, sin ciclo TDD)

**Input**: "implementa el componente" — tras dos rondas de iteración visual sobre un prototipo HTML/CSS/SVG publicado como Artifact (spec de diseño exacta aportada por el usuario; corrección de geometría del cráneo/cerebro; integración del SVG real de cráneo/cerebro aportado por el usuario), el usuario aprobó el diseño y pidió el componente React Native real.

**Contexto utilizado**: el propio prototipo HTML validado (colores, timings de animación, posiciones de zonas/símbolos/anillos en % del contenedor); el SVG de cráneo/cerebro del usuario, con su bounding box calculado mediante un script Node (`bbox.mjs`, parseo de comandos M/C/L/Z relativos) para recortar el `viewBox` con precisión; `docs/ADR/ADR-015_mobile_app_screens.md` (target de despliegue Android/iOS/Web, ya condicionaba que cualquier pieza visual funcione en los tres).

**Decisión tomada**: `react-native-svg` para el trazado (paths copiados tal cual del SVG del usuario en `anatomyPaths.ts`, sin reinterpretarlos) + gradientes; `react-native-reanimated` para las animaciones (`useSharedValue`/`useAnimatedStyle`/`useAnimatedProps`/`interpolate`, sustituyendo los `@keyframes` de CSS -- cada keyframe multi-parada se modela como un valor `progress` animado e `interpolate`, no un salto discreto entre etapas); `expo-blur` para el blur del status pill. Tres adaptaciones donde RN no tiene equivalente CSS directo, documentadas en `src/components/README.md`: `filter:blur()` de las zonas → `RadialGradient` de SVG, `backdrop-filter:blur()` → `expo-blur` con fallback web, parpadeo de cursor `step-end` → fundido rápido.

**Problema real encontrado y corregido de paso**: `react-native-web`/`react-dom` no estaban instalados -- `npx expo export --platform web` fallaba de inmediato con "missing web dependencies". No era solo un bloqueo de esta tarea: sin ellos, el target Web que ADR-015 fija como parte del despliegue (Android+iOS+Web) no funcionaba en absoluto. Instalados vía `npx expo install`.

**Output generado**: `apps/mobile-app/src/components/NeuralLoader/` (10 ficheros: `anatomyPaths.ts`, `constants.ts`, `HeadAnatomy.tsx`, `ActivityZone.tsx`, `EmergingSymbol.tsx`, `ScanRing.tsx`, `BackgroundGrid.tsx`, `Particle.tsx`, `ParticleField.tsx`, `StatusPill.tsx`, `NeuralLoader.tsx`, `index.ts`), `src/components/index.ts` (barrel nuevo), `babel.config.js` actualizado (`react-native-reanimated/plugin`). Sin test automático -- UI puramente visual/de animación, mismo criterio que `SecureStoreTokenStorage`/`WebTokenStorage`. Verificado con `tsc --noEmit`/`eslint` en verde y un bundle real de web (`npx expo export --platform web`, montado temporalmente en `app/index.tsx` y revertido) sin errores de import/runtime -- 1147 módulos. `npx turbo run typecheck lint test` → 31/31 en verde. iOS/Android sin verificar (sin simulador disponible), gap aceptado explícitamente.

---

## 2026-08-09 — invalidateStatisticsOnSessionStart (TDD Green) + wiring en useStartSession

**Input**: Red confirmado de `useSession.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `useSession.ts` (fase anterior, `useStartSession`/`useEndSession` ya existentes), `useQueryClient()` de `@tanstack/react-query` (hook que expone la instancia real del `QueryClient` del árbol de componentes).

**Decisión tomada**: `invalidateStatisticsOnSessionStart(queryClient)` como función exportada aparte de `useStartSession` — recibe el `QueryClient` en vez de leerlo de un hook, precisamente para poder testearla sin `QueryClientProvider`. `useStartSession` la invoca en `onSuccess`, pasándole el resultado de `useQueryClient()`. Sin comparar `mode`/`academicLevel` contra el valor anterior — invalidación incondicional en cada inicio de sesión, judgment call documentado (más simple y más seguro que llevar el rastro de si realmente cambió).

**Output generado**: `apps/mobile-app/src/api/hooks/useSession.ts` actualizado. README de `src/api` actualizado. 1/1 test verde (el ya confirmado en Red), `npx turbo run typecheck lint test` → 31/31 en verde (17/17 tests en `mobile-app`, antes 16).

---

## 2026-08-09 — src/api completo: requests + hooks de TanStack Query (TDD Green + wiring)

**Input**: Red confirmado de los 7 tests de `requests/*.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `fetchClient.ts` (ya implementado, reutilizado tal cual por todas las funciones de request), `useSessionStore.ts`/`createTokenStorage.ts` (para el `onSuccess` de login/registro), `@tanstack/react-query@^5.56.0` (API `useMutation`/`useQuery` de v5, ya en `package.json`).

**Decisión tomada**: `requests/{auth,session,answer,hint,statistics}.ts` — funciones puras `*Request(dto)`, una por ruta, todas delegando en `fetchClient`. `hooks/{useAuth,useSession,useAnswer,useHint,useStatistics}.ts` — un hook por función de `requests/`, wiring sin test (mismo criterio que `routes.ts`/`main.ts`). `useRegister`/`useLogin` llaman a `useSessionStore.getState().login(...)` en `onSuccess`, combinando `response.userId`/`response.sessionToken` con `variables.email` (la petición que el usuario acaba de enviar) — el backend no devuelve el email. `useUserStatistics` expone una `queryKey` compartida (`queryKeys.ts`) para que el header global y `(app)/statistics` (ambos previstos en ADR-015, todavía sin construir) reutilicen la misma caché. `/health` deliberadamente sin hook — ninguna pantalla lo consume.

**Output generado**: 5 ficheros en `src/api/requests/`, 5 en `src/api/hooks/`, `src/api/queryKeys.ts`, `src/api/index.ts` (barrel). README de `src/api` actualizado. 7/7 tests verdes (los ya confirmados en Red), `npx turbo run typecheck lint test` → 31/31 en verde en todo el monorepo (16/16 tests en `mobile-app`, antes 9). Pendiente: componer estos hooks dentro de pantallas reales (`src/screens`) y `app/`, todavía scaffolding.

---

## 2026-08-09 — Implementaciones reales de TokenStorage

**Input**: "implementa TokenStorage" — el usuario pidió cerrar el hueco que la entrada anterior dejaba explícito (puerto + fake de test, sin implementaciones reales).

**Contexto utilizado**: [ADR-015](../../docs/ADR/ADR-015_mobile_app_screens.md) (decisión: `expo-secure-store` en nativo, `localStorage` en web, seleccionado por `Platform.OS`), `TokenStorage.ts` (puerto ya definido, fase anterior), criterio ya establecido en la sesión para adaptadores que tocan un recurso real no disponible bajo el test runner (`LangChainChatModel`, `XenovaEmbedder`).

**Decisión tomada**: sin tests nuevos — ninguna de las tres piezas es testeable bajo Vitest/node (módulo nativo de Expo, `window`/DOM, resolución de `react-native` vía Metro). `SecureStoreTokenStorage` envuelve `getItemAsync`/`setItemAsync`/`deleteItemAsync`. `WebTokenStorage` envuelve `window.localStorage`. `createTokenStorage()` es la única pieza de wiring — mismo tratamiento que `main.ts` (sin test, wiring puro).

**Output generado**: `expo-secure-store` instalado (`npm install --workspace=apps/mobile-app`, resuelto a `^57.0.1`). `SecureStoreTokenStorage.ts`, `WebTokenStorage.ts`, `createTokenStorage.ts`. README de `src/store` actualizado. `npx turbo run typecheck lint test` → 31/31 en verde (9/9 tests existentes sin cambios, nada nuevo que testear).

---

## 2026-08-09 — Implementación de useSessionStore + fetchClient (TDD Green)

**Input**: Red confirmado de `useSessionStore.test.ts`/`fetchClient.test.ts` (Test Agent, fase previa, misma sesión). Primera implementación real de `mobile-app` del proyecto — hasta ahora solo scaffolding/documentación.

**Contexto utilizado**: [ADR-015](../../docs/ADR/ADR-015_mobile_app_screens.md) (diseño de `TokenStorage`/`useSessionStore`/`fetchClient`), `zustand@^4.5.0` (API `create()`), `expo/tsconfig.base` (`moduleResolution: "bundler"` — confirmado que, a diferencia de `backend-api`/`ai-engine`, no hace falta extensión `.js` en imports relativos).

**Decisión tomada**: `TokenStorage.ts` (interfaz, puerto local de `mobile-app` — no vive en `shared-domain`, es un concepto propio del cliente, no del dominio). `useSessionStore.ts` (Zustand): `hydrate`/`login`/`logout` reciben el `TokenStorage` inyectado en vez de importar una implementación concreta, para poder testear con el fake sin depender de un módulo nativo. Persiste `{userId, email, sessionToken}` como un único blob JSON (no solo el token) — necesario porque `email` no vuelve a llegar del backend tras el login (hueco real detectado al implementar, ya anticipado como riesgo menor en ADR-015 pero resuelto aquí de forma concreta). `fetchClient.ts`: `EXPO_PUBLIC_API_BASE_URL` (único prefijo que Expo expone al bundle de cliente) con fallback a `localhost:3000`, cabecera `Authorization` condicionada a que la ruta no esté en `PUBLIC_PATHS`, error lanzado con `body.error` (forma real confirmada en `errorMapping.ts`, no `body.message`).

**Problema real encontrado y corregido de paso**: `tsc --noEmit` fallaba en el test de `fetchClient` — TypeScript infería `fetchMock.mock.calls[0]` como tupla `[]` al no poder inferir la firma de un `vi.fn(async () => ...)` sin parámetros declarados. Corregido tipando explícitamente los parámetros del mock (`_input: RequestInfo | URL, _init?: RequestInit`).

**Output generado**: `apps/mobile-app/src/store/TokenStorage.ts`, `apps/mobile-app/src/store/useSessionStore.ts`, `apps/mobile-app/src/api/fetchClient.ts`, `apps/mobile-app/.env.example` (nuevo, `EXPO_PUBLIC_API_BASE_URL`). READMEs de `src/store`/`src/api` actualizados de "Pendiente de implementar" al estado real. 9/9 tests verdes (`vitest run`), `npx turbo run typecheck lint test` → **31/31 en verde** en todo el monorepo (primera vez que `mobile-app` aporta tests reales al pipeline, antes solo `--passWithNoTests`). Implementaciones concretas de `TokenStorage` (`expo-secure-store`/`localStorage`) y los hooks de TanStack Query de `src/api` quedan pendientes — siguiente paso lógico.

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

---

## 2026-08-07 — Prisma*Repository real (6 clases, TDD Green) + wiring de main.ts

**Input**: continuación sin pausa tras el Red de los 23 tests de integración (Test Agent). Implementar los 6 repositorios y conectar `main.ts` a Postgres real.

**Contexto utilizado**: los 23 `.integration.test.ts` (especificación real a satisfacer), `database/schema.prisma` (mapeo de columnas, incluida la adenda de este mismo día), los dobles `InMemory*` (semántica de referencia).

**Decisión tomada**: mapeo campo a campo entre entidades de dominio y filas de Prisma, con dos judgment calls documentados:
- **`PrismaAnswerRepository.save`**: el dominio `Answer` no lleva `userId`, pero la columna desnormalizada `answers.user_id` (ADR-013) lo necesita. Resuelto con una lectura extra (`session.findUniqueOrThrow` para obtener `userId`) dentro del propio `save()`, en vez de cambiar el contrato de `AnswerRepository` (que ya consumen `ValidateAnswerUseCase`/`EndSessionUseCase`/`GetUserStatisticsUseCase`, y cuyos tests no debían tocarse para esto).
- **`toDbGeneratedBy`/`toDomainGeneratedBy`** en `PrismaExerciseRepository`: Prisma expone el nombre del enum (`AiBatch`/`Manual`), no el valor `@map` (`ai-batch`/`manual`) que usa el dominio — conversión explícita en ambas direcciones, ninguna prueba existente lo había ejercitado hasta estos tests de integración.

`PrismaUserRepository.save` envuelve el upsert de `users` y el upsert de cada fila de `user_ratings` en una única `$transaction` (consistencia si falla a mitad).

**`main.ts`**: sustituidos los 6 repositorios en memoria por sus equivalentes Prisma (construidos sobre un `PrismaClient` compartido, `createPrismaClient(DATABASE_URL)`); `InMemoryTemaRepository` se queda igual (fuera de alcance, ADR-013). Dos huecos detectados al conectar el seed existente a persistencia real (con `InMemory` no importaban, se perdían enteros al reiniciar):
- El `Exercise` de seed usaba `crypto.randomUUID()` — con persistencia real, cada reinicio creaba un `Exercise` duplicado. Corregido con un id fijo (`00000000-0000-0000-0000-000000000001`), documentado en el propio archivo.
- `void exercises.save(...)` (hallazgo ya documentado por Reviewer, `STATUS.md` #28) pasa a `await` — con una Map en memoria la promesa se resolvía en el mismo tick y el hallazgo era solo higiene de estilo; con una escritura real a red/DB, un `POST /sessions` que llegara antes de que el seed terminara habría fallado de verdad.

**Migración real diferida**: `prisma migrate dev` falla en este entorno por un problema de Postgres ajeno al proyecto (discordancia de versión de collation en `template1`, típico tras una actualización de Windows) — confirmado con el usuario, se usó `prisma db push` para sincronizar el schema mientras tanto; las migraciones formales quedan pendientes de que se resuelva ese bug local.

**Output generado**: `apps/backend-api/src/infrastructure/repositories/Prisma{User,Session,Exercise,Answer,Hint,UserCredentials}Repository.ts` (implementación completa), `apps/backend-api/src/infrastructure/persistence/prismaClient.ts` (factory con `@prisma/adapter-pg`), `apps/backend-api/src/presentation/main.ts` (wiring). Verificado: `npx turbo run typecheck lint test` → **31/31 en verde**, 79 tests `backend-api` (sin cambios, DB-free por diseño). `npm run test:integration` → **23/23 en verde** contra Postgres real. Smoke test manual end-to-end repetido con el servidor reiniciado entre medias: mismo usuario, mismo rating (804.29), misma estadística de tema tras el reinicio — la prueba concreta de que la persistencia funciona.

**Output generado**: `apps/backend-api/src/presentation/http/errorMapping.ts` (nuevo) + `.test.ts` (4 tests), `apps/backend-api/src/presentation/http/routes.ts` (wiring actualizado), `apps/backend-api/src/application/use-cases/RegisterUseCase.ts` + `.test.ts` (1 test nuevo), `apps/backend-api/src/infrastructure/auth/JwtTokenIssuer.ts` + `.test.ts` (1 test nuevo). Verificado: `npx turbo run typecheck lint test` → **31/31 tareas en verde**, 79 tests en `backend-api` (antes 73).

---

## 2026-08-08 — UC-011 (RAG) implementado: Caso de Uso + 4 adaptadores + retrieval en UC-001/UC-003 + script de ingesta

**Input**: continuación sin pausa tras el Red de Test Agent. Implementar `IngestKnowledgeBaseUseCase`, sus 4 adaptadores reales, cablear retrieval en `GenerateExerciseBatchUseCase`/`QwenHintGenerator`, y el script de disparo.

**Contexto utilizado**: los tests Red de esta misma tarea, `docs/ADR/ADR-014_rag.md`, `GenerateExerciseBatchUseCase.ts` (patrón de constantes documentadas como judgment call, p.ej. `MAX_ATTEMPTS`).

**Decisión tomada**: `IngestKnowledgeBaseUseCase` — divide con `RecursiveCharacterTextSplitter` (`CHUNK_SIZE=1000`/`CHUNK_OVERLAP=100`, judgment call), detecta formato no soportado por extensión (`.txt`/`.md` en v1), un fichero con error se registra y se mueve igual al histórico para no bloquear el resto ni reprocesarse en bucle.

**Hueco de diseño detectado al implementar `PostgresKnowledgeBaseIndex`**: `RagChunk.ingestionRecordId` era una FK obligatoria, pero el puerto `KnowledgeBaseIndex.index()` (genérico, sin conocer el registro de ingesta que lo llama) no tenía forma de rellenarla. Corregido quitando la FK y añadiendo `sourceFileName`/`chunkIndex` como campos planos en `RagChunkInput` — misma trazabilidad práctica (qué fichero, qué posición), sin acoplar un puerto genérico al único llamador que existe hoy. `database/schema.prisma` actualizado, `IngestKnowledgeBaseUseCase` pasa `sourceFileName`/`chunkIndex` al indexar cada chunk.

**`PostgresKnowledgeBaseIndex`**: SQL crudo parametrizado (`$executeRaw`/`$queryRaw`, nunca concatenación) contra la columna `Unsupported("vector(384)")`; `<=>` (distancia coseno de pgvector) para `search`. **`XenovaEmbedder`**: sin test automático, mismo criterio que `LangChainQwenModel` (depende de descargar el modelo la primera vez).

**Retrieval en UC-001/UC-003**: `GenerateExerciseInput`/`GenerateHintInput` ganan `context?: readonly string[]`, interpolado en el prompt solo si no está vacío. `GenerateExerciseBatchUseCase` gana `KnowledgeBaseIndex` como 4ª dependencia (query = `Tema.code`+`description`); `QwenHintGenerator` como 2ª (query = `Exercise.topic`+`statement`). `TOP_K=3` en ambos, judgment call documentado.

**`main.ts`**: **no** se conectó `PostgresKnowledgeBaseIndex` real — se usa un objeto no-op inline (`index`/`search` vacíos, mismo criterio que `idGenerator`/`clock` ya inline en ese archivo) porque la tabla `rag_chunks` no existe todavía (pgvector bloqueado) y usar el adaptador real habría roto la generación de pistas por completo (excepción SQL) en vez de degradar con normalidad como exige US-008. Comentario en el propio archivo señala el cambio a hacer en cuanto pgvector esté disponible. Se evitó también importar `@mathmind/shared-testing` (`InMemoryKnowledgeBaseIndex`) desde el composition root de producción — es una devDependency, no debe viajar a `main.ts`.

**Script de ingesta** (`apps/backend-api/src/scripts/ingestKnowledgeBase.ts`, `npm run ingest:rag`): compone los adaptadores reales, valida `RAG_INPUT_DIR`/`RAG_HISTORY_DIR`/`DATABASE_URL` al arrancar (probado manualmente sin las variables — falla con un error claro, no una excepción confusa). `IngestKnowledgeBaseUseCase` se añadió al barrel `apps/ai-engine/src/index.ts` — hasta ahora ningún Caso de Uso de `ai-engine` se consumía desde `backend-api` fuera de tests, es el primer consumidor real cruzando el paquete.

**Bloqueo de infraestructura, no de código**: `prisma db push` sigue fallando (extensión `vector` no instalada, `STATUS.md`) — afecta tanto a `PostgresKnowledgeBaseIndex` (columna vectorial) como, se descubrió aquí, a `PrismaRagIngestionRepository` (sin columna vectorial) porque `db push` aplica el schema completo de una vez. Ambos tests de integración quedan escritos, implementados y confirmados en Red por la razón correcta antes de esto; no se puede confirmar su Green hasta que el usuario instale la extensión.

**Output generado**: `packages/shared-domain/src/{ports/{Embedder,KnowledgeBaseIndex,IngestionFileSystem}.ts,repositories/RagIngestionRepository.ts,entities/RagIngestionRecord.ts,value-objects/RagIngestionStatus.ts}`, `apps/ai-engine/src/rag/IngestKnowledgeBaseUseCase.ts`, `apps/backend-api/src/infrastructure/rag/{NodeIngestionFileSystem,XenovaEmbedder,PostgresKnowledgeBaseIndex}.ts`, `apps/backend-api/src/infrastructure/repositories/PrismaRagIngestionRepository.ts`, `apps/backend-api/src/scripts/ingestKnowledgeBase.ts`, `apps/ai-engine/src/prompts/{GenerateExercise,GenerateHint}.ts` (campo `context`), `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts`, `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts`, `apps/backend-api/src/presentation/main.ts`, `database/schema.prisma` (RagChunk rediseñado). Verificado: `npx turbo run typecheck lint test` → **31/31 en verde** (79 tests `backend-api` sin cambios de cantidad, 15 `ai-engine` — antes 10). `npm run test:integration` → **27/31 en verde**, 4 fallos documentados (bloqueo pgvector, no bug).

---

## 2026-08-08 — Cierre de UC-011: pgvector instalado, RAG verificado end-to-end con datos reales

**Input**: el usuario instaló pgvector y pidió continuar en el mismo mensaje que el commit de la implementación anterior.

**Contexto utilizado**: `STATUS.md` #33 (los 2 tests bloqueados, el no-op de `main.ts`), `apps/backend-api/src/infrastructure/rag/PostgresKnowledgeBaseIndex.integration.test.ts`.

**Decisión tomada**: `prisma db push` en verde tras confirmar `pg_available_extensions` (consulta de solo lectura) → `vector` instalada. Al ejecutar los tests antes bloqueados surgieron dos problemas reales, no del bloqueo: (1) `FakeEmbedder` generaba 8 dimensiones contra una columna `vector(384)` — pgvector lo rechazó con un error claro (`expected 384 dimensions, not 8`), corregido subiendo `FakeEmbedder` a 384 dimensiones (coherente con `XenovaEmbedder` real). (2) El test de similitud asumía que un fake sin semántica real podía demostrar que "fracciones" recupera antes que "Paris" — no hay garantía de eso con un hash determinista sin significado. Rediseñado para buscar con el mismo texto exacto que generó el embedding del chunk relevante (mismo embedder, mismo input, distancia garantizada 0), probando así la mecánica de orden SQL real sin depender de que el fake tenga semántica (esa garantía la da `XenovaEmbedder`, verificado aparte, manualmente). `main.ts`: sustituido el no-op inline por `new PostgresKnowledgeBaseIndex(prisma, new XenovaEmbedder())`.

**Verificación manual end-to-end** (no solo tests): fichero `.txt` real sobre fracciones equivalentes depositado en un directorio de prueba, `npm run ingest:rag` — descargó el modelo `Xenova/all-MiniLM-L6-v2` de HuggingFace Hub la primera vez, generó su embedding real, lo guardó en `rag_chunks`, registró `rag_ingestion_records` (`Processed`, 1 chunk), movió el fichero al histórico. `PostgresKnowledgeBaseIndex.search()` con una query relacionada semánticamente ("cómo se calculan fracciones equivalentes") recuperó el chunk correcto usando el modelo real, sin ningún fake en la cadena — primera prueba real de retrieval semántico de todo el proyecto. Datos de la prueba limpiados después.

**Output generado**: `packages/shared-testing/src/mocks/FakeEmbedder.ts` (384 dimensiones), `apps/backend-api/src/infrastructure/rag/PostgresKnowledgeBaseIndex.integration.test.ts` (test de similitud rediseñado), `apps/backend-api/src/presentation/main.ts` (adaptador real conectado). Verificado: `npx turbo run typecheck lint test` → **31/31 en verde**. `npm run test:integration` → **31/31 en verde** (0 bloqueados, todo el backend con cobertura real de punta a punta).