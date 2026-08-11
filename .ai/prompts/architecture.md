# Architecture Agent
Define architecture, diagrams, ADRs and design decisions. Respect Clean Architecture.

---

---
task_id: STATUS-052
date: 2026-08-10
agentes: [architecture]
flujo: [architecture, documentation]
artefactos: [docs/ADR/ADR-017_trazabilidad_y_metricas.md]
estado: done
---

## 2026-08-10 — ADR-017 Trazabilidad estructurada y métricas (fusión de diseños)

**Input**: el usuario pidió diseñar un ADR para convertir la trazabilidad de `.ai/prompts/*.md` de prosa a datos (front-matter YAML por entrada: `task_id`, `handoff_ref`, `agentes`, `artefactos`, `tests`) y poder computar los KPIs que las skills definen pero nunca miden (% handoff completo, % Reviewer/Security, tasa de retrabajo, cobertura) — gobernanza medida, material académico diferencial del TFM.

**Conflicto detectado durante el trabajo**: el pipeline paralelo (otro agente, commit `6828d48`) había creado su propio `ADR-017_trazabilidad_y_metricas.md` con un schema y decisiones divergentes, y además había descartado mi ADR-017 de Hugging Face (renumerado; HF quedó como configuración en `.env.example`). Presentado al usuario con las diferencias; resuelto vía AskUserQuestion: **fusionar sobre el ADR-017 del pipeline** incorporando las dos decisiones del usuario que el diseño original no incluía — **migración retroactiva** de toda la historia (baseline de KPIs desde el día 1) y **cobertura en dos capas** (declarada por entrada ahora, real con `@vitest/coverage-v8` a futuro). Se aceptó el descarte de HF como configuración.

**Decisión tomada** (resumen del ADR, ver fichero): front-matter YAML por entrada (obligatorios `task_id` `STATUS-<n>`, `date`, `agentes`, `flujo`, `estado`; recomendados `handoff_ref`, `artefactos`, `tests`, `cobertura`; condicional `rework_de`; invariante `agentes ⊆ flujo`, con `flujo` como propiedad de la tarea). 10 KPIs con fórmulas. Herramienta **única**: `scripts/metrics/trazabilidad.ts` con modos (KPIs por defecto, `--report`, `--lint` pre-flight), parser propio de subconjunto YAML sin dependencia nueva, sustituible por `js-yaml` sin cambiar el esquema. Migración retroactiva + entradas nuevas obligatorias + exemplares (esta entrada es el segundo exemplar; el primero está en `documentation.md`). Adenda de referencia cruzada en ADR-003. Sin código productivo tocado.

**Output generado**: [docs/ADR/ADR-017_trazabilidad_y_metricas.md](../../docs/ADR/ADR-017_trazabilidad_y_metricas.md) (base del pipeline + adenda de fusión), adenda en `docs/ADR-003_Trazabilidad.md`, exemplar en `.ai/prompts/documentation.md`. Retirado `docs/ADR/ADR-018_trazabilidad_y_metricas.md` (versión descartada en la fusión). Estado: Propuesto.

---

## 2026-08-10 — Adenda ADR-012: CORS (`CORS_ALLOWED_ORIGINS`)

**Input**: el usuario reportó que el registro fallaba por CORS al probar `mobile-app` (Expo Web, `:8081`) contra `backend-api` real (`:3000`) — orígenes distintos, sin ninguna cabecera CORS en las respuestas del backend. Pidió una allowlist configurable por `.env`, explícito en no comprometer la privacidad (sin wildcard).

**Decisión tomada**: nueva variable `CORS_ALLOWED_ORIGINS` (lista separada por comas), rechazo por defecto si no está definida — no un "permitir todo" de desarrollo. Tratada como configuración de red sensible bajo la misma disciplina de `.env`/`.env.example` que el resto de la línea base de seguridad (ADR-012 §1), no como una decisión nueva de autenticación/autorización (el `Bearer` sigue siendo el único control de acceso real). Adenda añadida a ADR-012 en vez de un ADR nuevo — es una extensión acotada de la línea base ya existente, mismo criterio que la adenda de `GET /temas` sobre ADR-006 el mismo día.

**Output generado**: adenda en `docs/ADR/ADR-012_linea_base_seguridad.md`. Detalle de implementación en `.ai/prompts/developer.md`.

---

## 2026-08-10 — Adenda ADR-006: `GET /temas` (catálogo real para el selector de `(app)/home`)

**Input**: al empezar a construir `(app)/home.tsx` (US-003) se detectó que no existía forma de que `mobile-app` obtuviera el catálogo de Temas — `TemaRepository` solo tenía `findByCode`, sin `findAll`; no había ruta `GET /temas` en `openapi.yaml`; y el seed real de `main.ts` era deliberadamente mínimo (1 Tema, comentado explícitamente como "no es el catálogo real"). Bloqueaba la pantalla por completo: US-003 exige elegir un Tema real del catálogo, no inventado en cliente. Presentado al usuario como decisión de arquitectura con dos opciones (endpoint real vs. catálogo estático en `shared-constants`); eligió el endpoint real.

**Decisión tomada**: `TemaRepository.findAll()` nuevo (sigue sin `save`, el catálogo se sigue poblando por seed, no por la Application layer — sin cambio respecto a la decisión original de ADR-006). `GET /temas`, protegido con el mismo `Bearer` que el resto de rutas autenticadas (coherencia de contrato, no porque el dato sea sensible). Sin filtrado server-side por `AcademicLevel` — el catálogo completo viaja de una vez, el cliente filtra localmente (cada `Tema` ya lleva su propio `academicLevels`), evitando un query param nuevo. Seed real de los 23 Temas de la sección "Catálogo inicial" de ADR-006, transcritos tal cual, sustituyendo el placeholder de 1 Tema.

**Output generado**: adenda en `docs/ADR/ADR-006_math_topics.md`, fila nueva en `ARCHITECTURE.md` ("API REST (Rutas)"), `GET /temas` + schemas `TemaDto`/`GetTemasResponseDto` en `apps/backend-api/openapi.yaml`. Detalle de implementación en `.ai/prompts/developer.md`.

---

## 2026-08-08 — ADR-015 Arquitectura de pantallas de `mobile-app`

**Input**: El usuario pidió planificar Casos de Uso/User Stories para generar `mobile-app`.

**Contexto utilizado**: scaffolding real de `apps/mobile-app` (`app/_layout.tsx`, `app/index.tsx` placeholder, 5 README bajo `src/` en estado "Pendiente de implementar"); `docs/ADR-001_LenguajesMetodologias.md` (Zustand/TanStack Query/Expo Router ya ratificados, no decisiones nuevas); `ARCHITECTURE.md` (responsabilidades de `mobile-app`: UX/navegación/estado/consumo API, explícitamente sin lógica de negocio); las 8 User Stories (`docs/user-stories/`); `apps/backend-api/openapi.yaml` (contrato de las 8 rutas reales, ya cierra el bloqueo que `src/api/README.md` señalaba).

**Decisión tomada**: mapeo de las 7 User Stories relevantes (US-001 a US-007; US-008 excluida, es flujo de administrador sin pantalla) a rutas de Expo Router con route groups `(auth)`/`(app)` y guard de autenticación centralizado; US-004/US-005/US-006(acción) comparten una única pantalla (`session/[sessionId]`), reflejando que las tres ocurren "en una sesión de entrenamiento activa"; patrón de `src/api/` como un hook de TanStack Query por ruta de `openapi.yaml`; formalización (no nueva decisión) del reparto TanStack Query (estado de servidor) / Zustand (estado de cliente, incluido el `sessionToken` en memoria).

**Revisión posterior, misma tarea**: el usuario aportó dos notas tras la primera versión. (1) despliegue en Android + iOS + Web (una sola base de código vía `react-native-web`) — invalida `expo-secure-store` a secas (no existe en navegador); corregido con `TokenStorage`, abstracción seleccionada por `Platform.OS` (`expo-secure-store` nativo / `localStorage` web), con el riesgo de seguridad más débil de `localStorage` (sin cifrado de SO, XSS) documentado como no mitigado en v1. (2) header/configuración global con el modo y nivel informados — resuelto con una cabecera común a `(app)` (email cacheado en Zustand desde el propio formulario de login/registro, ya que `LoginResponseDto`/`RegisterResponseDto` no lo devuelven; nivel/rating reutilizando el hook de TanStack Query ya necesario para `GET /users/me/statistics`, sin endpoint nuevo) más accesos directos a Estadísticas y Home — el formulario real de cambio de modo/nivel/tema sigue siendo únicamente el de `(app)/home` (US-003), el header no lo duplica.

**Output generado**: [docs/ADR/ADR-015_mobile_app_screens.md](../../docs/ADR/ADR-015_mobile_app_screens.md). READMEs de `apps/mobile-app/src/{screens,navigation,api,store}` actualizados para referenciarlo. `docs/user-stories/README.md` gana columna "Pantalla `mobile-app`" en el índice. `docs/STATUS.md` #34.

---

## 2026-08-05 — ADR-005 Adaptive Difficulty Engine

**Input**: Solicitud de diseñar ADR-005 (pendiente prioritario #2 en ADR-000_Estructura.md), con inputs/output ya fijados (Accuracy, Response Time, Current Streak, Previous Difficulty → Next Difficulty).

**Contexto utilizado**: ADR-000_Estructura.md (pendientes, UC-004), ARCHITECTURE.md (regla "sin IA en algoritmos de dificultad"), respuesta del usuario a AskUserQuestion eligiendo enfoque Elo continuo sobre fórmula ponderada e IRT/BKT.

**Decisión tomada**: Motor de dificultad basado en rating continuo tipo Elo, con `userRating` por `AcademicLevel` y `exerciseRating` autocalibrado por uso. Fórmulas de resultado esperado/real, factor K modulado por racha, y actualización simétrica de ambos ratings. Interfaces de dominio definidas sin implementación (restricción de esta skill).

**Output generado**: [docs/ADR/ADR-005-adaptive-difficulty-engine.md](../../docs/ADR/ADR-005-adaptive-difficulty-engine.md).

---

## 2026-08-05 — ADR-004 Modelo de Dominio

**Input**: Continuar con la definición de dominio, pendiente prioritario #1 de ADR-000_Estructura.md, nombrada por el usuario como `ADR-004_domain.md`.

**Contexto utilizado**: ADR-000_Estructura.md (entidades/VOs propuestos: User, Exercise, ExercisePool, Session, Hint, Answer, Achievement / Difficulty, AcademicLevel, Score, Timer, ExerciseType), README.md (modos Test/Resolución), ARCHITECTURE.md (dominio sin dependencias de frameworks, Regla de Reutilización), ADR-005 (representación de Difficulty ya decidida).

**Decisión tomada**: 6 entidades (User, Exercise, Session, Answer, Hint, Achievement) + 5 Value Objects (Difficulty, AcademicLevel, Score, Timer, ExerciseType). Desviación deliberada de ADR-000: `ExercisePool` se modela como contrato de repositorio, no como entidad, para evitar duplicar el campo `difficulty` de `Exercise` en dos sitios. Reconciliación de nombres con ADR-005: se unifica `Rating`→`Difficulty` como único VO canónico (aplicado también en ADR-005).

**Output generado**: [docs/ADR/ADR-004_domain.md](../../docs/ADR/ADR-004_domain.md).

---

## 2026-08-05 — División de ADR-000 en ADR-000/001/002/003 + STATUS.md

**Input**: Solicitud del usuario de dividir el "resumen maestro" `ADR-000_Estructura.md` en documentos temáticos separados, para respetar la convención de ADR (una decisión por registro, casi inmutable) en vez de mezclar producto, arquitectura, agentes, reglas y estado de avance en un único archivo.

**Contexto utilizado**: contenido íntegro del `ADR-000_Estructura.md` original; `ARCHITECTURE.md` (ya contenía "Estrategia IA" duplicada); `README.md` (Stack Tecnológico, hasta ahora no promovido a ADR); respuestas del usuario a AskUserQuestion confirmando que ADR-001 incluye Stack + Metodologías, y que el contenido vivo se extrae a `docs/STATUS.md`.

**Decisión tomada**: `ADR-000_Estructura.md` recortado a estructura/producto/monorepo; `ADR-001_LenguajesMetodologias.md` (stack + TDD/SDD); `ADR-002_Agentes.md` (sistema multiagente completo); `ADR-003_Trazabilidad.md` (TDD enforcement, reutilización, trazabilidad); `docs/STATUS.md` nuevo para pendientes/estado/próximos pasos. Se eliminó la sección "Estrategia IA" del split por estar duplicada en `ARCHITECTURE.md`, dejando ese documento como fuente canónica única. Se corrigieron referencias cruzadas obsoletas en ADR-004 y ADR-005 que apuntaban a contenido movido a `STATUS.md`.

**Output generado**: [docs/ADR-000_Estructura.md](../../docs/ADR-000_Estructura.md), [docs/ADR-001_LenguajesMetodologias.md](../../docs/ADR-001_LenguajesMetodologias.md), [docs/ADR-002_Agentes.md](../../docs/ADR-002_Agentes.md), [docs/ADR-003_Trazabilidad.md](../../docs/ADR-003_Trazabilidad.md), [docs/STATUS.md](../../docs/STATUS.md).

---

## 2026-08-05 — Casos de Uso UC-001 a UC-008

**Input**: Generar los Casos de Uso (pendiente #5 de STATUS.md) en `docs/use-cases/*`, formalizando la lista candidata UC-001 a UC-006 y cerrando el hueco de UC-007 detectado al escribir US-007.

**Contexto utilizado**: STATUS.md (lista candidata), docs/user-stories/* (las 7 historias, especialmente US-007 sin UC asignado), ADR-004 (entidades), ADR-005 (algoritmo de dificultad, banda de selección ±150), ADR-006 (taxonomía de temas, agregación por code/area), ARCHITECTURE.md (regla "IA no participa en cada petición").

**Decisión tomada**: 8 Casos de Uso. Se dividió el UC-001 original en **UC-001 Generate Exercise (Batch)** (IA, offline) y **UC-008 Select Next Exercise** (determinista, tiempo real) porque mezclaban actor/trigger distintos y la separación es necesaria para respetar la regla de que la IA no participa en el flujo crítico de cada petición. Se añadió **UC-007 Get User Statistics**, inexistente en la lista original, para dar soporte a US-007. UC-004 no repite el algoritmo de ADR-005, solo referencia esa fuente autoritativa.

**Output generado**: [docs/use-cases/](../../docs/use-cases/) (README índice + UC-001 a UC-008).

---

## 2026-08-05 — Scaffolding del monorepo (apps/ + packages/)

**Input**: Priorizar el scaffolding de `apps/` y `packages/` ahora que User Stories y Casos de Uso están cerrados (condición que el propio usuario había puesto para desbloquearlo). Alcance ya confirmado por AskUserQuestion en una vuelta anterior: npm workspaces + Turborepo, las 3 apps + los 6 packages. Solo tooling/estructura, sin lógica de negocio (consistente con la TDD Enforcement Rule, [ADR-003](../../docs/ADR-003_Trazabilidad.md): sin tests definidos todavía, no se implementa código de dominio).

**Contexto utilizado**: [ADR-000](../../docs/ADR-000_Estructura.md) (árbol del monorepo), [ADR-001](../../docs/ADR-001_LenguajesMetodologias.md) (stack: React Native/Expo/Zustand/TanStack Query, Node/Express, LangChain, Vitest/ESLint/Prettier), [ARCHITECTURE.md](../../ARCHITECTURE.md) (capas Clean Architecture, responsabilidades por app, contenido esperado de cada `shared-*`), [ADR-004](../../docs/ADR/ADR-004_domain.md) (entities/VOs/repositories a ubicar en `shared-domain`).

**Decisión tomada**:
- Se encontró un `pnpm-workspace.yaml` vacío que contradecía la elección previa de npm — se confirmó de nuevo con el usuario (AskUserQuestion) y se mantuvo npm workspaces + Turborepo; se borró el archivo pnpm contradictorio.
- `apps/backend-api`: capas `application/use-cases`, `infrastructure/{repositories,persistence}`, `presentation/http` (sin `domain` propio — las entidades viven en `shared-domain`).
- `apps/ai-engine`: `src/batch` (UC-001) y `src/prompts` (UC-003, contratos IA pendientes).
- `apps/mobile-app`: Expo, sin librería de navegación (no estaba decidida en ADR-001, se dejó como pendiente explícito en vez de asumirla) ni lógica de negocio (regla de ARCHITECTURE.md).
- 6 `shared-*` packages con la estructura de ADR-004 (`entities/`, `value-objects/`, `services/`, `repositories/` en `shared-domain`).
- **Se detectó y corrigió una dependencia circular real**: `shared-testing` depende de `shared-domain`/`shared-types` (para builders tipados), así que se quitó `shared-testing` como devDependency de `shared-domain` y `shared-utils` — de lo contrario Turborepo habría rechazado el grafo de tareas `build` por ciclo. Documentado en `packages/shared-testing/README.md`.
- Todo el código fuente creado son placeholders (`export {}` + comentarios a los ADR/UC relevantes) o bootstraps mínimos sin lógica de negocio — no se violó la TDD Enforcement Rule.

**Output generado**: `package.json`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `.nvmrc` (raíz); `apps/backend-api`, `apps/ai-engine`, `apps/mobile-app`; `packages/shared-domain`, `shared-types`, `shared-utils`, `shared-testing`, `shared-config`, `shared-constants`.

**Verificación post-install**: `npm install` falló en el primer intento (`ERESOLVE`: `langchain@^0.3.0` en `ai-engine` chocaba con `@langchain/core@1.x` resuelto vía `@langchain/anthropic`, un peer opcional de `langchain`). Se corrigió a `langchain@^1.5.0` (versión actual verificada con `npm view`). Tras eso, `npm install` (1460 paquetes) y `npx turbo run typecheck` (requirió añadir `"packageManager": "npm@11.6.1"` a la raíz) terminaron en verde: 13/13 tareas.

---

## 2026-08-05 — Expo Router para apps/mobile-app

**Input**: Decidir librería de navegación para `mobile-app` (quedó pendiente al hacer el scaffolding inicial, punto #10 de STATUS.md). Se discutió con el usuario React Navigation vs. Expo Router; recomendé Expo Router y el usuario lo confirmó ("actualiza a expo router").

**Contexto utilizado**: `apps/mobile-app/src/navigation/README.md` (pendiente sin decidir), ADR-001 (stack sin librería de navegación), docs/user-stories/ (pantallas ya listadas, mapeo natural con enrutado por archivos).

**Decisión tomada**: Expo Router (construido sobre React Navigation, default actual de Expo). Versiones verificadas vía `npm view` en vez de asumidas: `expo-router@^57.0.0`, `expo-linking@^57.0.0`, `expo-constants@^57.0.0`, `react-native-safe-area-context@^5.8.0`, `react-native-screens@^4.26.0`. `main` pasa a `expo-router/entry`; se elimina `index.ts` y `src/App.tsx`; se crean `app/_layout.tsx` y `app/index.tsx`. `app.json` gana `scheme`, `plugins: ["expo-router"]`, `experiments.typedRoutes`, `web.bundler`. Las pantallas siguen viviendo en `src/screens/` (componentes), `app/` queda como wrappers finos de enrutado.

**Output generado**: `apps/mobile-app/package.json`, `app.json`, `app/_layout.tsx`, `app/index.tsx`, `src/screens/README.md`, `src/navigation/README.md` (decisión registrada), `docs/ADR-001_LenguajesMetodologias.md`, `docs/STATUS.md` (punto #10 cerrado).

**Verificación post-install (Expo Doctor)**: mis versiones iniciales de `expo`/`react`/`react-native` (placeholder, SDK 51) estaban muy desactualizadas frente a la SDK real disponible (57) — corregido con `npx expo install --fix`, la herramienta oficial de Expo para alinear versiones, en vez de seguir adivinando con `npm view`. `app.json` usaba una propiedad `splash` ya obsoleta en la SDK actual — eliminada. Quedó pendiente y documentado un aviso no bloqueante de `expo-doctor` sobre dos copias de `react` en el árbol (`19.2.3` en `apps/mobile-app`, correcta y exacta; `19.2.8` en la raíz, arrastrada por una dependencia transitiva de `ai-engine` — `langchain → @langchain/langgraph → @langchain/langgraph-sdk` — que nunca importa React). Se evaluó forzar una única versión con `overrides` en package.json pero se revirtió: interfería con la resolución correcta que npm ya hacía por defecto (mobile-app con su copia local exacta) sin garantizar converger a la versión correcta. Como `ai-engine` y `mobile-app` son targets de build completamente separados (tsx/node vs Metro), no hay colisión real en tiempo de ejecución — se documenta como aceptado, no se persigue más.

---

## 2026-08-05 — Contratos de repositorio (packages/shared-domain)

**Input**: Definir los contratos de dominio en dos fases (petición del usuario): primero repositorio, luego frontera. Esta entrada cubre solo la fase de repositorio.

**Contexto utilizado**: ADR-004 (formas de entidades/VOs, hasta ahora solo en prosa), ADR-005 (VO `Difficulty`), ADR-006 (`TemaCode`, banda ±150), docs/use-cases/UC-001 a UC-008 (cada método de cada repositorio se derivó de un paso de UC concreto, no CRUD especulativo), ADR-003 (TDD Enforcement Rule — se confirmó que interfaces/types puros sin comportamiento no la violan).

**Decisión tomada**: Materializados como TypeScript reales en `packages/shared-domain/src/{value-objects,entities,repositories}`: 6 Value Objects, 5 IDs nominales ("branded"), 5 entidades (sin `Achievement`, no usado por ningún UC todavía), 5 contratos de repositorio (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`) con upsert único (`save`) en vez de create/update separados. **Se detectó y corrigió una inconsistencia real**: `UserRepository.findByEmail` (necesario para US-001) requiere que `User` tenga `email`, pero ADR-004 excluía "autenticación/credenciales" del entity — se resolvió distinguiendo email (identidad de dominio) de credenciales (hash de contraseña, fuera de alcance), y se actualizó ADR-004 en consecuencia. `TemaCode` se mantuvo como `string` (no unión literal) porque ADR-006 declara el catálogo "no exhaustivo, se amplía con uso real".

**Output generado**: 18 archivos `.ts` en `packages/shared-domain/src/`, barrel export actualizado. `npx turbo run typecheck` (13/13) y `lint` de `shared-domain` verificados en verde tras el cambio.

---

## 2026-08-05 — Contratos de frontera: DTOs API + contrato Qwen (fase 2)

**Input**: Fase 2 de la definición de contratos (fase 1 fue repositorio): DTOs de API entre `mobile-app`↔`backend-api`, y contrato de entrada/salida de Qwen para `ai-engine`.

**Contexto utilizado**: docs/use-cases/UC-001 a UC-008, docs/user-stories/ (especialmente US-001/US-002 para Auth, sin UC asignado), ADR-004/005/006 (tipos de dominio ya materializados en fase 1), ADR-012 (línea base de seguridad).

**Decisión tomada**: 7 archivos de DTOs en `packages/shared-types/src/dtos` (Auth, User, Session, Exercise, Answer, Hint, Statistics) y 2 contratos Qwen en `apps/ai-engine/src/prompts` (GenerateExercise, GenerateHint). Decisiones de diseño explícitas: `ExercisePublicDto` excluye `correctAnswer`/`explanation`/`difficulty` (no deben viajar al cliente antes de responder — refuerza ADR-012); `SubmitAnswerResponseDto` compone UC-002+UC-008 en una sola respuesta HTTP para evitar doble round-trip; se detectó que `hintsUsed` (UC-003) no puede persistirse en `Answer` hasta que este existe (se crea solo en UC-002) — documentado como hueco de infraestructura (contador efímero, candidato Redis), no resuelto aquí; validación en tiempo de ejecución del contrato Qwen (necesaria para `.withStructuredOutput()` de LangChain) queda explícitamente diferida, sin decidir librería (zod u otra), mismo criterio que la librería de navegación de `mobile-app`.

**Problema real encontrado y corregido**: al añadir `shared-types → shared-domain` como dependencia, `ai-engine` (moduleResolution `NodeNext`) falló al consumir `shared-domain` (imports relativos sin extensión, válidos solo bajo `moduleResolution: "Bundler"`). Se corrigieron todos los imports relativos internos de `shared-domain` y `shared-types` añadiendo extensión `.js` explícita (convención TS bajo NodeNext/ESM). De paso, al añadir `"type": "module"` al `package.json` raíz (arreglo de un aviso de rendimiento de ESLint), se destapó un hueco preexistente no relacionado: `eslint.config.js` no declaraba globals de CommonJS, rompiendo el lint de `apps/mobile-app/babel.config.js` — corregido con un override de `languageOptions.globals` para archivos de config CJS.

**Output generado**: `packages/shared-types/src/dtos/*.ts` (7 archivos + README), `apps/ai-engine/src/prompts/{GenerateExercise,GenerateHint}.ts` (+ README actualizado), `packages/shared-types/package.json` (nueva dependencia), `eslint.config.js`, `package.json` raíz. `npx turbo run typecheck lint`: 22/22 en verde.

---

## 2026-08-06 — ADR-013 Modelo de Datos Físico + schema.prisma

**Input**: Pregunta del usuario en US-001 (Registro): ¿falta algún artefacto de conexión/definición de BBDD? Correcto — ni el esquema físico ni el ORM estaban ratificados (Prisma solo aparecía como ejemplo suelto en ARCHITECTURE.md, igual que la librería de navegación de `mobile-app` en su momento). Confirmado Prisma con el usuario vía AskUserQuestion.

**Contexto utilizado**: ADR-004 (entidades a mapear), ADR-005 (Difficulty → difficultyValue), ADR-006 (TemaCode, sin FK todavía), UC-008 (query de selección que determina el índice crítico), UC-007 (agregación que motiva la desnormalización de `answers.user_id`), ADR-000 (ubicación `database/` ya prevista en el árbol del monorepo).

**Decisión tomada**: `database/schema.prisma` — 6 tablas (`users`, `user_ratings`, `exercises`, `sessions`, `answers`, `hints`), IDs UUID, índice compuesto `(academicLevel, topic, difficultyValue)` en `exercises` para UC-008, `user_id` desnormalizado en `answers` para UC-007 (documentado como desviación deliberada del dominio, justificada). `Achievement` no se mapea (sin materializar en dominio todavía).

**Problema real encontrado y corregido**: Prisma 7.9.1 (versión actual real, verificada con `npm view`, no asumida) cambió su modelo de configuración — `datasource.url` ya no se admite en `schema.prisma`, se movió a un `prisma.config.ts` nuevo con `defineConfig()`. Se corrigió creando `apps/backend-api/prisma.config.ts` acorde a la documentación actual (consultada vía WebFetch, no memoria — mismo criterio que evitó repetir el error de versión de `langchain`/Expo). Verificado con `prisma validate` y `prisma generate` reales (con `DATABASE_URL` placeholder, sin necesitar PostgreSQL vivo) — ambos en verde.

**Output generado**: `docs/ADR/ADR-013_modelo_datos_fisico.md`, `database/schema.prisma`, `database/README.md`, `apps/backend-api/prisma.config.ts`, `apps/backend-api/package.json` (deps `@prisma/client`/`prisma`/`dotenv`, scripts `db:generate`/`db:migrate`), READMEs de `infrastructure/persistence` e `infrastructure/repositories` actualizados. `npx turbo run typecheck lint`: 22/22 en verde tras el cambio.

---

## 2026-08-05 — ADR-006 Taxonomía de Conocimiento Matemático

**Input**: Solicitud de crear `ADR-006_math_topics` (pendiente #3 de STATUS.md), organizando el conocimiento matemático para clasificar ejercicios, medir progreso, detectar fortalezas/debilidades, permitir itinerarios adaptativos y facilitar generación de contenido IA, con taxonomía jerárquica sin escalado innecesario y rangos de dificultad alineados a edad/rating. Confirmado por AskUserQuestion: alcance de Ingeniería limitado a cálculo mental aplicado.

**Contexto utilizado**: STATUS.md (pendiente #3), ADR-004 (`Exercise.topic` como placeholder pendiente de esta taxonomía), ADR-005 (escala `Difficulty` y bandas por `AcademicLevel`), ADR-000 (Modo Test/Resolución con temporizador, restringe alcance de Ingeniería).

**Decisión tomada**: taxonomía de 2 niveles (Área → Tema), 5 Áreas y ~20 Temas iniciales, cada uno con `difficultyRange` por `AcademicLevel` como sub-rango de la banda global ya definida en ADR-005 (sin crear escala de dificultad nueva), y `prerequisites` opcional para itinerarios futuros. Regla anti-escalado: un Tema se reutiliza entre niveles, nunca se duplica por nivel.

---

## 2026-08-06 — Resolución del solape architecture.md / documentation.md (punto 4 de la revisión de skills)

**Input**: El usuario aclaró el punto 4 de la revisión de `.ai/skills/`: Documentation Agent no debe escribir en ARCHITECTURE.md, se centra en documentación generada (README, diagramas, índices) y debe informar de los ficheros modificados en cada tarea.

**Contexto utilizado**: `.ai/skills/architecture.md` y `.ai/skills/documentation.md` (ambas reclamaban ADRs/ARCHITECTURE.md en sus Responsabilidades/Salidas, sin que ninguna aclarara quién manda).

**Decisión tomada**: `architecture.md` queda como único autor de ARCHITECTURE.md y del contenido de los ADRs (añadido explícito en Responsabilidades). `documentation.md` se reescribió: ya no lista "Architecture" como responsabilidad propia, mantiene solo índice/coherencia de referencias entre ADRs (no su contenido), y gana una responsabilidad nueva — informar de los ficheros modificados en cada tarea.

**Output generado**: `.ai/skills/architecture.md`, `.ai/skills/documentation.md`.

---

## 2026-08-06 — Actualización de ejemplos de knowledge-manager.md (punto 5 de la revisión de skills)

**Input**: Actualizar los 7 ejemplos worked-examples de `.ai/skills/knowledge-manager.md`, escritos antes de que existiera código real y desincronizados de lo que sí se construyó esta sesión.

**Contexto utilizado**: los 7 ejemplos originales (citaban `GenerateExerciseUseCase`/`GenerateHintUseCase` inexistentes, `Difficulty Calculator`/`ExerciseTimer`/`UserViewModel` que nunca existieron, `ADR-003 Exercise Caching Strategy` cuando el ADR-003 real es otro tema, `Exercise Pool` como pieza de arquitectura cuando ADR-004 decidió que es `ExerciseRepository.findByDifficultyBand`, convención `.spec.ts` cuando la real es `.test.ts`), contrastados contra el estado real del repo (`packages/shared-domain`, `docs/use-cases/`, `docs/ADR/`).

**Decisión tomada**: los 7 ejemplos reescritos con rutas de archivo y referencias reales, verificadas una a una con `ls` antes de darlas por buenas (ninguna inventada). Ejemplo 3 y 7 se mantuvieron conceptualmente iguales (seguían siendo válidos), solo se añadieron rutas concretas.

**Output generado**: `.ai/skills/knowledge-manager.md`.

---

## 2026-08-06 — Esqueletos de Infrastructure: Database, API, LLM

**Input**: El usuario pidió generar las clases de Database, API y LLM de infraestructura. Se identificó un impedimento real: la TDD Enforcement Rule (ADR-003) y la ausencia total de Casos de Uso implementados (`apps/backend-api/src/application/use-cases` sigue siendo solo un README) bloquean implementar lógica real ahí. Confirmado por AskUserQuestion: solo firmas de clase (`declare class`, sin cuerpo), mismo patrón que `computeNextDifficulty` en su fase Red y que los contratos de repositorio de `packages/shared-domain`.

**Contexto utilizado**: contratos de `packages/shared-domain/src/repositories/*.ts` (fase 1 de contratos), DTOs de `packages/shared-types/src/dtos/*.ts` y contrato Qwen de `apps/ai-engine/src/prompts/*.ts` (fase 2), ADR-013 (modelo de datos físico que las implementaciones Prisma consumirán), ADR-003 (TDD Enforcement Rule).

**Decisión tomada**: 11 archivos `declare class` sin cuerpo — 5 `Prisma*Repository` (Database, implementan los contratos de `shared-domain`), 5 `*Controller` (API, tipados contra los DTOs, sin conocer Express directamente — el mapeo Request/Response queda para más adelante), y `QwenClient` (LLM, consume los contratos `GenerateExercise*`/`GenerateHint*` ya existentes). Ninguno tiene lógica ni contradice ADR-003.

**Output generado**: `apps/backend-api/src/infrastructure/repositories/Prisma{User,Session,Answer,Hint,Exercise}Repository.ts`, `apps/backend-api/src/presentation/http/{Auth,Session,Answer,Hint,Statistics}Controller.ts`, `apps/ai-engine/src/llm/QwenClient.ts` (+ README). READMEs de `infrastructure/repositories` y `presentation/http` actualizados. Verificado: `npx turbo run typecheck lint` → 13/13 en ambos, en verde a la primera.

---

## 2026-08-06 — Huecos de dominio para UC-002/UC-004 (Exercise.timer, INITIAL_RATING, puertos IdGenerator/Clock)

**Input**: Antes de escribir tests para el primer Caso de Uso completo (`ValidateAnswerUseCase`/`UpdateDifficultyUseCase`, elegidos por el usuario vía AskUserQuestion sobre UC-005/UC-008), se detectaron 3 huecos de materialización al tipar las firmas reales.

**Contexto utilizado**: `docs/ADR/ADR-004_domain.md:114` (ya asume `Exercise.timer` para derivar `AttemptResult.timeLimitMs`, pero `Exercise.ts` nunca lo llevó), `AdaptiveDifficultyEngine.test.ts` (usa 1200 como rating inicial de ejemplo, sin constante formal), ausencia total de un puerto para IDs/timestamps en `shared-domain` (ningún Caso de Uso lo había necesitado hasta ahora). Confirmado con el usuario vía AskUserQuestion: puertos `IdGenerator`/`Clock` (mismo patrón ports-and-adapters que los repositorios) en vez de `crypto.randomUUID()`/`new Date()` directos, para permitir fakes deterministas en tests.

**Decisión tomada**: `Exercise.timer: Timer` añadido (cierra un hueco de materialización contra un ADR ya aprobado, no una decisión nueva); `INITIAL_RATING: Difficulty = { value: 1200 }` en `Difficulty.ts`; `packages/shared-domain/src/ports/{IdGenerator,Clock}.ts` (directorio nuevo, mismo nivel que `repositories/`).

**Output generado**: `packages/shared-domain/src/entities/Exercise.ts`, `src/value-objects/Difficulty.ts`, `src/ports/{IdGenerator,Clock,README}.ts/.md`, `src/index.ts` (barrel actualizado).

---

## 2026-08-06 — Huecos de dominio para UC-003/UC-006 (Session.ratingAtStart, puerto HintUsageTracker)

**Input**: El usuario pidió avanzar con UC-003 (Generate Hint) y UC-006 (End Session) — ambos descartados en la iteración anterior por huecos de diseño sin resolver. Se resuelven aquí en vez de diferirlos de nuevo, por indicación directa del usuario ("avanza con UC3 y UC6").

**Contexto utilizado**: `packages/shared-types/src/dtos/Hint.ts` (nota de diseño ya existente: `hintsUsedSoFar` "requiere... un contador efimero por sesion+ejercicio, candidato Redis, ya previsto en la Cache Strategy de ARCHITECTURE.md" — confirma que el hueco ya estaba anticipado, no es una decisión nueva desde cero), `docs/use-cases/UC-006-end-session.md` (paso 2, "variación de userRating desde el inicio de la sesión" — no derivable de otro modo, los deltas de cada intento no se persisten individualmente), `ARCHITECTURE.md` (Backend API y AI Engine son apps/cajas separadas en el diagrama — la Application layer de `backend-api` no debe depender directamente de `apps/ai-engine`).

**Decisión tomada**: `Session.ratingAtStart: Difficulty` (snapshot al crear la sesión, mismo patrón que `Exercise.timer` — campo requerido por un UC ya aprobado, no materializado hasta ahora). Puerto `HintUsageTracker` nuevo en `packages/shared-domain/src/ports` (mismo patrón que `IdGenerator`/`Clock`) para el contador efímero. Puerto `HintGenerator` definido localmente en `GenerateHintUseCase.ts` (no en `shared-domain`, porque es específico de este caso de uso, no reutilizado) para desacoplar la Application layer de `apps/ai-engine` — la implementación real (adaptador que invoque a `QwenClient`/`ai-engine`) queda diferida, mismo patrón que `Prisma*Repository`/Controllers.

**Output generado**: `packages/shared-domain/src/entities/Session.ts`, `src/ports/{HintUsageTracker,README}.ts/.md`, `src/index.ts` (barrel actualizado).

---

## 2026-08-06 — Catálogo de Temas para UC-005/UC-008 (entidad Tema, TemaRepository)

**Input**: El usuario pidió generar UC-005 (Start Session) y UC-008 (Select Next Exercise) — el último hueco pendiente del set de Casos de Uso, señalado en la iteración anterior: ninguno de los dos podía implementarse sin un puerto para el catálogo de Temas de ADR-006.

**Contexto utilizado**: `docs/ADR/ADR-006_math_topics.md` ("Esquema de Tema", ya especifica exactamente `code`, `area: AreaCode`, `label`, `description`, `academicLevels: {level, difficultyRange}[]`, `prerequisites?` — se transcribe sin reinterpretar), su nota "Consecuencias/Negativas" (sin proceso formal de gobernanza de altas — confirma que el catálogo se puebla por seed/migración, no por un Caso de Uso, de ahí que el puerto no lleve `save`), `packages/shared-types/src/dtos/Exercise.ts` (`ExercisePublicDto` ya fija la forma pública de un Exercise sin `correctAnswer`/`difficulty`/`explanation` — replicada como tipo propio de Application en `SelectNextExerciseUseCase.ts`, sin importar el DTO para no invertir la dependencia Presentation→Application).

**Decisión tomada**: `Tema`/`AreaCode` en `packages/shared-domain/src/entities/Tema.ts` (entidad de catálogo, con identidad vía `code`, no un Value Object). `TemaRepository` en `repositories/` (no en `ports/`, para mantener consistencia con el resto de contratos de persistencia) con un único método `findByCode` — sin `save`, decisión justificada arriba.

**Output generado**: `packages/shared-domain/src/entities/Tema.ts`, `src/repositories/TemaRepository.ts`, `src/index.ts` (barrel actualizado).

---

## 2026-08-06 — QwenClient real: transporte, validación y alcance (adenda ADR-001)

**Input**: El usuario preguntó si, para tener un `QwenClient` real, había que empezar a definir `apps/ai-engine` como puente entre backend y LangChain. Se identificaron 3 decisiones arquitectónicas abiertas repetidas en el código sin ratificar: transporte backend-api↔ai-engine, librería de validación en tiempo de ejecución del output de Qwen, y alcance de la tarea.

**Contexto utilizado**: `ARCHITECTURE.md` (dibuja Backend API y AI Engine como cajas separadas pero nunca especifica transporte — sin "HTTP"/"REST"/"cola" en todo el documento), `apps/ai-engine/package.json` (sin Express/Fastify/cliente de colas — solo `langchain`), `.env.example` de `ai-engine` (`QWEN_API_KEY`/`QWEN_BASE_URL` ya placeholder, compatible con un endpoint estilo OpenAI), `docs/STATUS.md` #22 (decisión previa de esta misma sesión: `HintGenerator` como puerto, explícitamente no un import directo de `apps/ai-engine` desde Application — pero esa regla es de capa Application, no prohíbe que Infrastructure sí importe `ai-engine` como librería), nota repetida 4 veces en el código ("p. ej. zod", nunca ratificada), ADR-001 (precedente de decidir librerías "en el momento de implementar", ver Expo Router).

**Decisión tomada** (confirmada vía AskUserQuestion): (1) transporte **import directo in-process** — sin servidor HTTP nuevo, sin cola, desproporcionado para un TFM sin evidencia de despliegue/escalado independiente; (2) **Zod** para validación de forma del output de Qwen, registrado como adenda en ADR-001; (3) alcance **QwenClient + adaptador `HintGenerator`** (cierra UC-003 de punta a punta), UC-001 queda fuera.

**Output generado**: `docs/ADR-001_LenguajesMetodologias.md` (adenda 2026-08-06, sección Motor IA + Zod añadido a la lista de stack).

---

## 2026-08-06 — API REST: mapeo de rutas a Controllers

**Input**: El usuario pidió pedirle al Product Agent una User Story para que el backend "genere los endpoints" que el front necesita. Se señaló un desajuste con la metodología propia del proyecto: `docs/user-stories/README.md` dice explícitamente que las User Stories "no incluyen diseño técnico ni de arquitectura — eso es responsabilidad del Architecture Agent", y `.ai/skills/product.md` tiene como restricción "No crear arquitectura". Confirmado con el usuario vía AskUserQuestion: el Architecture Agent define el mapa de rutas, no una User Story nueva.

**Contexto utilizado**: los 5 Controllers ya existentes (`apps/backend-api/src/presentation/http/*.ts`, `declare class` sin cuerpo) y los DTOs de `packages/shared-types/src/dtos` (ya fijados en la fase de contratos de frontera), `ARCHITECTURE.md` (sección Presentation ya lista "REST Controllers/Routes/Middlewares" como ejemplos, sin mapa concreto).

**Decisión tomada**: una ruta por DTO, sin anidar recursos en la URL cuando el DTO ya lleva el identificador en el body (evita duplicar el dato). Auth vía `Authorization: Bearer <sessionToken>`, resuelto por middleware a `userId` inyectado en el Controller — nunca tomado del body. Dos huecos de contrato detectados y corregidos al mapear: `RequestHintRequestDto` no llevaba `elapsedMs` (input obligatorio de `GenerateHintUseCase`); `SessionController.startSession` no tenía forma de recibir `userId`. Un hueco de autorización detectado y **documentado pero no corregido** (fuera de la restricción "no implementar" de esta skill): `EndSessionUseCase`/`ValidateAnswerUseCase`/`GenerateHintUseCase` no verifican que la `Session` pertenezca al usuario autenticado (riesgo IDOR) — queda como requisito explícito para el Developer Agent antes de implementar los Controllers reales.

**Output generado**: `ARCHITECTURE.md` (nueva sección "API REST (Rutas)"), `packages/shared-types/src/dtos/Hint.ts` (`elapsedMs` añadido), `apps/backend-api/src/presentation/http/SessionController.ts` (`userId` añadido a `startSession`). Verificado: `npx turbo run typecheck lint` → 23/23 en verde (solo cambios de contrato/tipos, sin lógica).

---

## 2026-08-07 — Backend real: UC-009/UC-010, puertos de auth, corrección de SEED_RATING_BY_LEVEL

**Input**: "comenzamos con el backend" — construir los Controllers reales + Express siguiendo el mapa de rutas ya definido. Antes de tocar Presentation, se detectó que `AuthController` no tenía Caso de Uso que invocar: US-001/US-002 nunca tuvieron UC asignado (mismo motivo que UC-007 en su momento).

**Contexto utilizado**: `docs/user-stories/US-001-registro.md`/`US-002-login.md` (AC exactos: mensaje de error genérico en login, semilla de rating al registrarse), ADR-004 ("las credenciales... quedan fuera de alcance [de User], responsabilidad de backend-api" — decisión original, nunca materializada), ADR-012 (hash bcrypt/argon2, JWT nombrado explícitamente como "futuras claves de firma"), ADR-005 (tabla de semillas por `AcademicLevel`, descubierta al implementar el sembrado real: Primaria 800, Secundaria 1200, Bachillerato 1600, Ingeniería 2000 — no un valor único).

**Decisión tomada**: UC-009 Register / UC-010 Login (nuevos docs de caso de uso). Puertos `PasswordHasher`/`TokenIssuer` en `packages/shared-domain/src/ports`, entidad `UserCredentials` + `UserCredentialsRepository` deliberadamente separados de `User`. **Bug real corregido, no solo hueco**: `INITIAL_RATING` (constante plana 1200) se sustituye por `SEED_RATING_BY_LEVEL: Record<AcademicLevel, Difficulty>` — el valor plano solo coincidía por casualidad con la semilla de `Secundaria`; para `Primaria`/`Bachillerato`/`Ingeniería` sembraba el rating equivocado. 4 consumidores actualizados (`ValidateAnswerUseCase`, `EndSessionUseCase`, `SelectNextExerciseUseCase`, `StartSessionUseCase`); verificado que ningún test existente cambiaba de resultado (todos usaban `Secundaria`).

**Output generado**: `docs/use-cases/UC-009-register.md`, `UC-010-login.md` (+ índice actualizado), `packages/shared-domain/src/{entities/UserCredentials.ts,repositories/UserCredentialsRepository.ts,ports/{PasswordHasher,TokenIssuer}.ts}`, `packages/shared-domain/src/value-objects/Difficulty.ts` (`SEED_RATING_BY_LEVEL`).

---

## 2026-08-07 — Huecos detectados construyendo Controllers reales (IDOR, Session.topic, HintUsageTracker.get, GetUserStatisticsUseCase)

**Input**: continuación directa del backend real — construir los 5 Controllers surgió cuatro huecos más, cada uno al intentar mapear un DTO/flujo ya diseñado contra la implementación real existente.

**Contexto utilizado**: `ARCHITECTURE.md` "API REST" (hueco IDOR ya señalado como pendiente en la entrada anterior, sin corregir entonces por estar fuera de la restricción "no implementar" de esta skill), `packages/shared-types/src/dtos/Answer.ts` (comentario propio: "UC-002 y UC-008... composición a nivel de contrato HTTP" — confirma que `AnswerController`, no `ValidateAnswerUseCase`, es quien debe invocar UC-008 tras cada respuesta), `packages/shared-types/src/dtos/Statistics.ts` (`TopicStatDto.area`, `academicLevel` — campos que `GetUserStatisticsOutput` no producía).

**Decisión tomada**: (1) IDOR — `EndSessionUseCase`/`ValidateAnswerUseCase`/`GenerateHintUseCase` ganan `userId` en su input, verifican `session.userId === input.userId`. (2) `Session.topic: TemaCode` añadido a la entidad (mismo patrón que `Exercise.timer`/`Session.ratingAtStart`) — sin esto, `AnswerController` no podía saber qué tema seguir sirviendo tras el primer ejercicio de la sesión. (3) `HintUsageTracker.get` (lectura sin incrementar) añadido al puerto — `AnswerController` necesita leer `hintsUsed` sin alterar el contador, y sin confiar en que el cliente lo reporte. (4) `GetUserStatisticsUseCase` gana `TemaRepository` como dependencia para resolver `area` por tema y `academicLevel` (nivel actual del usuario) en su output.

**Output generado**: `packages/shared-domain/src/entities/Session.ts`, `src/ports/HintUsageTracker.ts`, `apps/backend-api/src/application/use-cases/{EndSessionUseCase,ValidateAnswerUseCase,GenerateHintUseCase,GetUserStatisticsUseCase,StartSessionUseCase}.ts` (todos ya Green, actualizados con nuevas verificaciones/dependencias y sus tests).

---

## 2026-08-07 — Schema físico real: UserCredentials, Session.topic/ratingAtStart, Exercise.timeLimitMs (adenda ADR-013)

**Input**: el usuario eligió como siguiente paso implementar los `Prisma*Repository` reales. Antes de tocar código de repositorio, exploración del estado actual (`database/schema.prisma`, entidades de dominio) detectó que el schema físico se había quedado desactualizado.

**Contexto utilizado**: `packages/shared-domain/src/entities/{Session,Exercise,UserCredentials}.ts` (campos ya existentes en el dominio: `Session.topic`/`ratingAtStart`, `Exercise.timer.limitMs`, entidad `UserCredentials` completa), `database/schema.prisma` (comentario propio: "Credenciales... fuera de alcance... hasta que se implemente US-001/US-002" — ya implementados), `docs/ADR/ADR-013_modelo_datos_fisico.md` (decisión original de mapeo entidad→tabla).

**Decisión tomada**: nuevo modelo `UserCredentials` (`user_credentials`, 1:1 con `User`, mismo criterio de separación de ADR-004). `Session` gana `topic String` y `ratingAtStart Float`. `Exercise` gana `timeLimitMs Int`. Ninguna decisión previa de ADR-013 (ORM, UUIDs, índice de `exercises`, desnormalización de `answers.user_id`) cambia — solo se completa el modelo con lo que el dominio ya había decidido. Adenda añadida a ADR-013 en vez de un ADR nuevo (mismo criterio que las adendas de ADR-001/ADR-002 esta sesión). Verificado: `npx prisma validate` → schema válido.

**Output generado**: `database/schema.prisma`, `docs/ADR/ADR-013_modelo_datos_fisico.md` (adenda).

---

## 2026-08-08 — ADR-014 y UC-011: definición del Caso de Uso de RAG (US-008)

**Input**: el usuario pidió definir el Caso de Uso de US-008 — indexado + embeddings (LangChain) en `ai-engine`, conectados a UC-001/UC-003, sin seguridad de ficheros en v1 (ya resuelto por US-008), disparado por script/cron, con registro de ingesta en Postgres. Trajo casi todas las decisiones tomadas; quedaba abierta la tecnología de indexado vectorial (propuso Chroma inicialmente).

**Contexto utilizado**: `docs/user-stories/US-008-subir-material-rag.md` ("Fuera de alcance": tagging fichero↔Tema, mecanismo de disparo, persistencia del registro, tecnología vectorial — los cuatro huecos que este ADR/UC cierra), `apps/ai-engine/src/llm/ChatModel.ts` (`invoke(prompt: string)`, un único string — cualquier contexto RAG debe interpolarse en el prompt, no viaja por un canal aparte), `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts` y `apps/backend-api/src/application/use-cases/GenerateHintUseCase.ts` (puntos exactos donde debe engancharse el retrieval, antes de invocar `QwenClient`), `docs/ADR-001_LenguajesMetodologias.md` ("Motor IA": LangChain/Qwen/Zod, sin mención previa a embeddings/vectores — diseño desde cero), `database/schema.prisma` (convenciones de ADR-013 a replicar), `.ai/skills/architecture.md` (restricción "no implementar código productivo" — esta tarea es solo diseño).

**Decisión tomada** (confirmada vía AskUserQuestion, dos rondas): (1) embeddings con modelo **local** (`@xenova/transformers`), sin API externa. (2) **pgvector, no Chroma** — al señalar que el cliente JS de LangChain para Chroma exige un servidor HTTP aparte (sin modo embebido en Node), el usuario preguntó explícitamente por las ventajas de pgvector; comparadas ambas (cero servicio nuevo, consistencia transaccional con el registro de ingesta, un solo backup, frente a la concesión de perder el query builder tipado de Prisma para la columna `vector`), se optó por pgvector — mismo criterio "sin servicios nuevos en mono-servidor" ya aplicado a Postgres. (3) Sin tagging fichero↔Tema en la ingesta: la asociación ocurre por similitud semántica en el momento de generar (query construida desde `Tema.code`+`description`+`AcademicLevel` en UC-001, desde `Exercise.topic`+`statement` en UC-003), no al ingerir. (4) UC-001 y UC-003 se amendan (no se crean como UC nuevos) con un paso de retrieval — el retrieval no tiene actor/trigger propio. (5) Formatos v1: texto plano/Markdown, PDF/DOCX fuera de alcance. (6) Dos modelos nuevos en `schema.prisma` (`RagIngestionRecord`, `RagChunk` con `Unsupported("vector(384)")`, extensión `pgvector` habilitada declarativamente vía `previewFeatures`/`datasource.extensions`) y dos puertos nuevos en `shared-domain` (`RagIngestionRepository`, `KnowledgeBaseIndex`) sin implementación.

**Output generado**: `docs/ADR/ADR-014_rag.md` (nuevo), `docs/use-cases/UC-011-ingest-knowledge-base.md` (nuevo), `docs/use-cases/{UC-001-generate-exercise-batch,UC-003-generate-hint}.md` (amendados con el paso de retrieval), `docs/use-cases/README.md` y `docs/user-stories/README.md` (índices actualizados), `database/schema.prisma` (2 modelos + enum + extensión), `apps/backend-api/.env.example` (`RAG_INPUT_DIR`/`RAG_HISTORY_DIR`/`RAG_CRON_SCHEDULE`), `ARCHITECTURE.md` (sección "RAG (Base de Conocimiento)"). Verificado: `npx prisma validate` → schema válido. Ningún fichero de código productivo tocado, ninguna dependencia instalada (fuera de alcance de esta tarea, ver ADR-014).

---

**Output generado**: [docs/ADR/ADR-006_math_topics.md](../../docs/ADR/ADR-006_math_topics.md). Actualizados: `ADR-004_domain.md` (`Exercise.topic` tipado como `TemaCode`, ya no placeholder) y `STATUS.md` (pendiente #3 completado, Dominio al 100%).