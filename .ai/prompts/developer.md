# Developer Agent
Implement only after tests exist. Follow TDD and Clean Architecture.

---

---
task_id: STATUS-064
date: 2026-08-21
agentes: [developer]
flujo: [director, product, architecture, test, developer, reviewer, security, documentation]
estado: done
---

## 2026-08-21 — Implementación de US-010 Cerrar sesión (TDD Green + wiring)

**Input**: continuación directa del Red de `.ai/prompts/test.md` (misma fecha) — implementar `computeInactivityPhase` y todo lo que la adenda ADR-015 dejó diseñado (logout manual, hook de inactividad, modal de aviso).

**Contexto utilizado**: adenda ADR-015 (mecanismo exacto ya especificado, incluida la ramificación por `Platform.OS`), `apps/mobile-app/src/store/useSessionStore.ts` (`logout`/`login` ya existentes, sin tocar), `apps/mobile-app/src/components/Combobox` (precedente de uso del `Modal` nativo de React Native), `apps/mobile-app/src/components/AppHeader/AppHeader.styles.ts` (paleta `COLORS`/estilo de `navButton` reutilizado para el botón nuevo y para `InactivityWarningModal`).

**Decisión tomada**: `computeInactivityPhase` (Green, `apps/mobile-app/src/store/inactivity.ts`) implementa la máquina de 3 estados tal cual la especificó Architecture. `useInactivityLogout` (hook, sin test) monta un único `setInterval` de 1s que llama a `computeInactivityPhase`, ramifica la fuente de eventos de actividad por `Platform.OS` (`onTouchStart` expuesto para que `(app)/_layout.tsx` lo cablee en su `View` raíz; `mousedown`/`keydown` de `window` registrados internamente solo en Web), y llama `useSessionStore.getState().logout(createTokenStorage())` al expirar. `InactivityWarningModal` (componente nuevo, carpeta propia con `.styles.ts`+`index.ts`, mismo patrón que el resto de `src/components/`) usa el `Modal` nativo de React Native. Botón "Cerrar sesión" añadido a `AppHeader.tsx` junto a Inicio/Estadísticas, mismo estilo `navButton`. `(app)/_layout.tsx` monta `useInactivityLogout()` una vez (antes de los `if` de `route`, respetando las Rules of Hooks) y envuelve `<AppHeader/>`+`<Slot/>`+`<InactivityWarningModal/>` en la `View` raíz con `onTouchStart={registerActivity}`.

**Verificación real, no solo con tests**: dos scripts Playwright desechables (borrados tras usarlos, no forman parte del repo) contra la build web real de `mobile-app` (`npx expo export --platform web` + `e2e/serve.mjs`) y el backend Docker real. Detectado y corregido un hueco del propio entorno de pruebas al hacerlo: el servidor de `:8081` llevaba sirviendo un `dist/` estático de una build anterior a este cambio (`e2e/serve.mjs` no tiene recarga en caliente) — sin el rebuild explícito, la primera verificación habría dado un falso negativo ("botón no existe"). Con el rebuild: (1) logout manual confirmado de punta a punta (clic → redirige a login → recarga confirma que la sesión se borró de verdad). (2) cierre por inactividad confirmado con el reloj virtual de Playwright (`page.clock`, instalado antes del login para que el `setInterval` nazca ya controlado): activo a los 13 min, aviso a los 14 min, "Seguir conectado" lo oculta y reinicia el contador, cierre real 15 min después sin más actividad.

**Output generado**: `apps/mobile-app/src/store/{inactivity,useInactivityLogout}.ts`, `apps/mobile-app/src/components/InactivityWarningModal/` (nuevo), `apps/mobile-app/src/components/AppHeader/AppHeader.tsx`, `apps/mobile-app/src/components/index.ts`, `apps/mobile-app/app/(app)/_layout.tsx`. 6/6 tests nuevos, 86/86 en total. `npx turbo run typecheck lint test --filter=@mathmind/mobile-app`: 6/6 en verde.

---

## 2026-08-11 — Fix: "Siguiente ejercicio" no funcionaba (Modo Resolución, `calc.limites`) + UC-008 flujo 2b

**Input**: el usuario reportó que "Siguiente ejercicio" no funcionaba en Modo Resolución para el Tema `calc.limites`, e hipotetizó que la causa era el Exercise Pool vacío, proponiendo que en ese caso se pidiera un lote nuevo al LLM (UC-008 flujo 2b, ya diseñado en la doc pero nunca implementado).

**Diagnóstico (antes de tocar código)**: `psql` directo contra la BBDD real mostró que el pool NO estaba vacío — 3 `Exercise` Resolution/Bachillerato para `calc.limites`. La hipótesis del usuario no explicaba el síntoma. Investigación más profunda reveló dos bugs independientes, uno sistémico:
1. `GenerateExerciseBatchUseCase` asignaba el mismo `targetDifficulty` (punto medio del rango) a los `count` ejercicios de una misma llamada — confirmado con `psql` que esto afectaba ~70+ combinaciones del lote reciente completo, no solo `calc.limites`. `SelectNextExerciseUseCase` elige "el más cercano al rating" y, ante empate exacto, siempre el primero (`reduce` con `<` estricto) — con 3 ejercicios idénticos en dificultad, "siguiente" repetía indefinidamente el mismo.
2. `FindByDifficultyBandQuery` nunca filtraba por `type` (Test/Resolution) — un hueco más grave, independiente del anterior: "siguiente ejercicio" podía devolver un `Exercise` de un `type` distinto al `Session.mode`, violando una invariante ya documentada en `Session.ts` ("todo Answer referencia un Exercise cuyo type coincide con mode") pero nunca aplicada en la consulta real.

Consultado el usuario (`AskUserQuestion`, 3 alcances de fix crecientes) → eligió el alcance completo, incluyendo construir UC-008 flujo 2b.

**Decisiones tomadas**:
- `computeSpreadDifficulty(range, index, total)` en `GenerateExerciseBatchUseCase.ts` — reparte la dificultad de forma determinista y equiespaciada (`min` en `index=0` → `max` en `index=total-1`) en vez de un valor fijo repetido. `index` = `saved.length` en el momento de guardar (no la posición en el array crudo del LLM), así que sigue siendo correcto aunque haya reintentos por invariantes violadas a mitad de lote.
- `FindByDifficultyBandQuery` (shared-domain) gana `type: ExerciseType` (obligatorio) y `excludeIds?: readonly ExerciseId[]` (opcional). `SelectNextExerciseInput` gana los mismos dos campos (`type` obligatorio, `excludeExerciseIds` opcional). Actualizados ambos invocadores reales de `SelectNextExerciseUseCase`: `AnswerController` (pasa `session.mode` + ids ya respondidos vía `AnswerRepository.findBySessionId`) y **`StartSessionUseCase`** (mismo hueco de `type` detectado ahí también, independiente — el primer ejercicio de cada sesión tampoco se filtraba).
- `SessionScreen`'s efecto de reset (`result`/`submittedValue`/`selectedOption`) pasa de depender de `exercise?.id` a `exerciseShownAt` — `setExercise` siempre actualiza este timestamp, incluso si el "nuevo" ejercicio resulta ser idéntico al anterior (edge case que puede seguir dándose en Temas con muy pocos ejercicios incluso tras los fixes de arriba); con `exercise?.id` como dependencia, ese caso dejaba la pantalla congelada con el resultado previo, deshabilitada — parecía un botón roto.
- **UC-008 flujo 2b** (`AnswerController.tryReplenishPool`): cuando ni banda ampliada ni exclusión de ya respondidos dan candidatos, busca el `Tema` completo (`TemaRepository.findByCode(session.topic)`) e invoca `GenerateExerciseBatchUseCase` (`ON_DEMAND_BATCH_COUNT = 3`) antes de reintentar la selección una vez. Si la generación falla (Tema desconocido, error del LLM, `IAClient` no configurado) se rinde con gracia — `nextExercise` se omite, mismo comportamiento que antes de existir esta capacidad. Única excepción documentada a "UC-008 es determinista, no invoca IA" (ARCHITECTURE.md) — deliberadamente solo en la rama de último recurso, nunca en el camino feliz, para no añadir latencia de IA a cada respuesta.
- `main.ts` gana una instancia real de `GenerateExerciseBatchUseCase` (antes solo existía en el script `generate:exercises`) — mismo patrón de fallback-con-gracia que `hintGenerator` si `AI_API_KEY`/`AI_BASE_URL` no están configurados.

**Output generado**: `packages/shared-domain/src/repositories/ExerciseRepository.ts`, `packages/shared-testing/src/mocks/InMemoryExerciseRepository.ts`, `apps/backend-api/src/infrastructure/repositories/PrismaExerciseRepository.ts`, `SelectNextExerciseUseCase.ts`/`.test.ts`, `StartSessionUseCase.ts`, `AnswerController.ts`/`.test.ts`, `main.ts`, `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts`/`.test.ts`, `apps/mobile-app/src/screens/SessionScreen.tsx`, `docs/use-cases/UC-008-select-next-exercise.md`/`UC-001-generate-exercise-batch.md`. Tests nuevos: 2 en `SelectNextExerciseUseCase.test.ts`, 2 en `AnswerController.test.ts` (incluye reposición exitosa end-to-end con fakes), 1 en `GenerateExerciseBatchUseCase.test.ts`. `backend-api` 95/97 (el resto es el bug pre-existente de Windows en `NodeIngestionFileSystem.test.ts`, ajeno a esta tarea), `ai-engine` 18/18, `mobile-app` 71/71. `tsc`/`eslint` limpios en los tres + `shared-domain`/`shared-testing`. Integration test real contra Postgres actualizado y en verde.

---

## 2026-08-11 — `SessionSummaryScreen` (US-006-resultado)

**Input**: el usuario pidió proponer la siguiente pantalla. Detectado (no pedido explícitamente) que `SessionScreen.handleFinish` ya navegaba a `/(app)/session/[sessionId]/summary` — ruta inexistente, enlace roto ahora mismo en la app — y que el resumen (`EndSessionResponseDto`) ya llegaba sembrado en caché de TanStack Query esperando un consumidor. Propuesto vía `AskUserQuestion` frente a la alternativa de construir Estadísticas (US-007) primero; el usuario confirmó Resumen de Sesión.

**Decisión tomada**: `SessionSummaryScreen.format.ts` aísla el formateo puro (`computeAccuracyPercent`/`formatAvgResponseTime`/`formatRatingChange`), testeado por TDD sin depender de React/RN, mismo criterio que `SessionScreen.timer.ts`. `computeAccuracyPercent` devuelve `null` con `totalAttempts=0` en vez de `NaN`/dividir entre cero — la pantalla distingue explícitamente "sin intentos" de "0% de aciertos" (US-006, escenario "Sesión sin ejercicios respondidos"). La pantalla lee el resumen con `useQuery({ queryKey: queryKeys.sessionSummary(sessionId), queryFn: skipToken })` (API de TanStack Query v5 para suscribirse a una entrada de caché sin `queryFn` real) en vez de una lectura imperativa (`queryClient.getQueryData`) fuera del sistema de queries — mantiene el mismo patrón "server state via TanStack Query" ya fijado en ADR-015. Sin resumen en caché (entrada directa por URL, recarga de página) → redirige a Home, mismo criterio que `SessionScreen` ante un `sessionId` sin sesión activa en el store. Fondo `BackgroundGrid`+`ParticleField` (sin Modal en esta pantalla) — mismo patrón que Login/Register, a diferencia de Home/Session que omiten `ParticleField` por el `Modal` del `Combobox`.

**Hallazgo real, ajeno a la pantalla en sí**: `useEndSession` nunca invalidaba `queryKeys.statistics` tras finalizar. El score/rating cambian con cada `Answer` registrada durante la sesión (ADR-005), pero nada disparaba una revalidación al terminar — `AppHeader`/Home seguían mostrando el rating de antes de la sesión hasta la siguiente recarga completa de la app. Se hizo visible precisamente al construir esta pantalla (que muestra el `ratingChange` exacto de la sesión, sin que se reflejara en ningún otro sitio). Añadida `invalidateStatisticsOnSessionEnd` en `useSession.ts`, mismo patrón ya existente que `invalidateStatisticsOnSessionStart` (función pura extraída, testeada con un `QueryClient` real y un spy, sin renderizar componentes).

**Output generado**: `src/screens/SessionSummaryScreen.{tsx,styles.ts,format.ts,format.test.ts}` (nuevos), `app/(app)/session/[sessionId]/summary.tsx` (nuevo, coexiste con el archivo `session/[sessionId].tsx` ya existente sin conflicto de Expo Router), `src/api/hooks/useSession.ts`/`.test.ts` (`invalidateStatisticsOnSessionEnd`), `src/screens/SessionScreen.tsx`/`src/api/queryKeys.ts` (comentarios actualizados, la ruta ya no es "pendiente"). 9 tests nuevos en `format.test.ts` + 1 en `useSession.test.ts`. `npx tsc --noEmit`/`eslint` limpio, `vitest run` → 18/18 archivos, 71/71 tests en `mobile-app` (antes 61). Verificado con bundle real (`expo export --platform web`, sin errores) sirviendo el bundle nuevo.

---

## 2026-08-11 — Rename `QwenClient` → `IAClient`

**Input**: el usuario pidió renombrar `QwenClient`/`QwenClient.test` y sus referencias a `IAClient`, "para ser agnóstico al motor como habíamos decidido en sesiones anteriores" — el propio código ya documentaba esto como pendiente (`IAClient.ts` antiguo: "nombre historico Qwen, ver ADR-001 -- en la practica agnostico de proveedor").

**Decisión tomada**: `git mv` de `QwenClient.ts`/`.test.ts` → `IAClient.ts`/`.test.ts` (preserva historial de git). Clase `QwenClient` → `IAClient`. Parámetro de constructor `qwen` → `ia` en `GenerateExerciseBatchUseCase` y `QwenHintGenerator` (mismo criterio: el nombre de una referencia también es una referencia). Actualizadas todas las referencias vivas en código real: imports/tipos (`Pick<IAClient, ...>`), barrel export de `ai-engine/src/index.ts`, instanciación en `main.ts`/`generateExerciseBatch.ts`, y los README.md que describen la arquitectura actual (`llm/README.md`, `batch/README.md`, `prompts/README.md`, `infrastructure/ai/README.md`).

**Alcance, deliberadamente acotado**: `QwenHintGenerator` (clase de `backend-api`) no se renombra — el usuario pidió específicamente "QwenClient", una clase distinta; renombrar también esa habría sido asumir alcance no pedido. Tampoco se tocan los logs históricos fechados (`docs/STATUS.md`, `.ai/prompts/*.md`, `docs/ADR-001_LenguajesMetodologias.md`) — son registros de decisiones en el tiempo, reescribirlos para que digan "IAClient" en frases que describen lo que era cierto entonces falsearía la historia (mismo criterio ya aplicado a otros ADRs con "Adenda" fechada en vez de edición directa).

**Output generado**: 16 ficheros (`ai-engine`: `IAClient.ts`/`.test.ts` renombrados, `GenerateExerciseBatchUseCase.ts`/`.test.ts`, `index.ts`, `ChatModel.ts`, `prompts/GenerateHint.ts`, 3 README.md; `backend-api`: `GenerateHintUseCase.ts`, `QwenHintGenerator.ts`/`.test.ts`, `main.ts`, `scripts/generateExerciseBatch.ts`, `infrastructure/ai/README.md`). Sin cambios de comportamiento. `ai-engine` 17/17 tests, `backend-api` 91/91 tests (sin cambios de cantidad en ninguno), `tsc --noEmit`/`eslint` limpios en ambos. Verificado con el backend en caliente (`tsx watch`, recarga en vivo del archivo), sigue respondiendo (`GET /temas` → 401 sin token, igual que antes) tras el rename.

---

## 2026-08-11 — Fix: sesión de cliente no se invalidaba ante un 401

**Input**: el usuario pidió arrancar el servicio para validar funcionalidad. Al reiniciar `backend-api` se descubrió `JWT_SECRET` completamente ausente de `.env` (el servidor no arrancaba) — corregido generando un secreto de desarrollo. Tras arrancar, el usuario reportó que Home mostraba el nivel académico correcto pero ningún Tema cargado.

**Diagnóstico**: reproducido en vivo por `curl` con un token fresco — `/temas` funciona perfectamente (23 temas, 6 aplican a Primaria). El backend y los datos estaban bien; el fallo era enteramente del cliente. Causa: `fetchClient.ts` nunca reaccionaba a un 401 (hueco ya señalado en una revisión de seguridad anterior de esta misma sesión) — al rotar `JWT_SECRET`, cualquier `sessionToken` persistido en el navegador quedó inválido, pero la app lo seguía tratando como sesión activa. `useUserStatistics` mostraba datos cacheados de antes del reinicio (por eso el nivel sí se veía); `useTemas` (`staleTime: Infinity`, sin caché previa en esa pestaña) lanzó una petición fresca que chocó con el token muerto y falló en silencio — React Query la deja en estado error, la UI solo ve una lista vacía.

**Decisión tomada**: nueva acción `expireSession()` en `useSessionStore` — limpia solo el estado en memoria (`sessionToken`/`userId`/`email` a `null`), sin `TokenStorage`. Se probó primero llamar a `logout(createTokenStorage())` directamente desde `fetchClient.ts`, pero `createTokenStorage.ts` importa `react-native` (`Platform`) para elegir implementación por plataforma, y eso rompe la resolución de módulos de Vitest en cuanto se evalúa (confirmado empíricamente: incluso con `import()` dinámico, el test que sí dispara la rama 401 falló al parsear el módulo) — mismo criterio ya documentado en ese archivo ("sin test automático"). `expireSession()` evita el acoplamiento manteniendo `fetchClient.ts` puro. Se dispara solo en un 401 de una ruta protegida (no en `/auth/login`, donde un 401 son credenciales inválidas, no sesión caducada). El guard de `(app)/_layout.tsx` ya reaccionaba a `sessionToken === null` redirigiendo a login — no hizo falta tocarlo.

**Output generado**: `src/api/fetchClient.ts` (rama 401), `src/store/useSessionStore.ts` (`expireSession`), `src/api/fetchClient.test.ts` (2 tests nuevos: 401 protegido limpia sesión, 401 en login no la toca). `npx tsc --noEmit` limpio, `vitest run` → 17/17 archivos, 61/61 tests en `mobile-app` (antes 59). Verificado reconstruyendo y re-sirviendo el bundle web real.

---

## 2026-08-11 — Ingesta RAG de `ayudas-agilidad-calculo.txt` (pistas de Modo Test descartadas)

**Input**: el usuario notó la tabla `hints` vacía tras poblar el Exercise Pool y pidió cargar `rag/input/ayudas-agilidad-calculo.txt` (trucos de agilidad de cálculo mental) y luego generar pistas, incluyendo para Modo Test, ligadas al problema.

**Diagnóstico**: `hints` vacía es el comportamiento esperado — `GenerateHintUseCase` genera pistas bajo demanda (UC-003), nunca en batch; UC-001 (`generate:exercises`) nunca las toca. `RAG_INPUT_DIR`/`RAG_HISTORY_DIR` estaban vacíos en `.env` (nunca configurados), así que ni la ingesta podía correr — corregidos a `../../rag/input`/`../../rag/history`.

**Decisión tomada**: ejecutado `npm run ingest:rag` (1 procesado, 0 errores) — mejora el contexto RAG que `QwenHintGenerator` ya usa para pistas reales de Modo Resolución. Pre-generar `hints` para Modo Test se descartó: contradice directamente US-005 ("Modo Test no ofrece pistas", `GenerateHintUseCase.ts:69-71` lanza si `exercise.type !== 'Resolution'`) y US-004 (la nota de cálculo mental es "contenido genérico y constante, no ligado al ejercicio", explícitamente no una pista) — ambas fijadas por el propio usuario esta misma sesión. `AskUserQuestion` → confirmó mantener el AC.

**Output generado**: ninguno versionado — `.env` y `rag/` están en `.gitignore`, solo se documenta aquí para trazabilidad.

---

## 2026-08-11 — Revisión de `count` en `generate:exercises`: bug de sintaxis, tipado, coacción number→string

**Input**: el usuario añadió manualmente un parámetro `count` a `GenerateExerciseBatchUseCase`/`QwenClient`/el prompt (pedir varios ejercicios por llamada al LLM, menos consumo de cuota) y pidió pasar los tests de `ai-engine` y revisar.

**Hallazgos y decisiones**:
- `QwenClient.test.ts` tenía un `it(...)` anidado a medio editar dentro de otro `it(...)` — error de sintaxis, la suite ni parseaba. Separado en dos tests hermanos.
- El constructor de `GenerateExerciseBatchUseCase` había quedado `Partial<Pick<QwenClient, 'generateExercise' | 'generateExercises'>>` con varios `as any` para esquivar errores de TS en vez de resolverlos. Corregido a `Pick<QwenClient,'generateExercise'> & Partial<Pick<QwenClient,'generateExercises'>>` (el fake de test solo implementa `generateExercise`; el cliente real tiene ambos) y eliminados los `as any` — ya no hacían falta. Import muerto (`generateExerciseOutputSchema`) eliminado de `QwenClient.ts`. Mismo criterio aplicado al `as any` residual en `generateExerciseBatch.ts` (backend-api).
- Al ejecutar el lote completo con `count=3` (proveedor activo: Groq/`gpt-oss-120b`), el modelo devuelve `correctAnswer`/`options` como JSON number en vez de string, sobre todo en Modo Resolución — el schema Zod rechazaba la respuesta entera, perdiendo los 3 ejercicios de la llamada. `AskUserQuestion` → el usuario eligió corregir el schema ahora y relanzar solo los combos fallidos. Añadido `stringifiableValue` (`z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1))`) en `generateExerciseOutputSchema` (`GenerateExercise.ts`) — coacciona en el borde (ADR-012) en vez de confiar en que el LLM respete el formato pedido.

**Resultado del lote**: catálogo completo (23 Temas × niveles × Test/Resolution, `count=3`) → 168 generados / 16 fallidos (el bug de arriba, antes del fix). Reintento acotado solo a esos 16 combos, ya con el fix → 48 generados / 0 fallidos. Total: 216 ejercicios nuevos en el Pool.

**Output generado**: `src/llm/QwenClient.ts`/`.test.ts`, `src/batch/GenerateExerciseBatchUseCase.ts`/`.test.ts`, `src/prompts/GenerateExercise.ts` (schema), `apps/backend-api/src/scripts/generateExerciseBatch.ts` (cleanup). `ai-engine`: 17/17 tests (antes 15), `tsc --noEmit`/`eslint` limpio. `backend-api`: `tsc --noEmit` limpio.

---

## 2026-08-11 — `Teclado` cableado en `SessionScreen` (solo iOS/Android)

**Input**: el usuario pidió, para las versiones móviles, añadir el `Teclado` (construido en la tarea anterior, sin cablear) debajo del enunciado en Modo Resolución, deshabilitar el teclado nativo del terminal, y sincronizar las pulsaciones con el input.

**Decisión tomada**: `SHOW_TECLADO = Platform.OS !== 'web'` — el `Teclado` solo se renderiza en iOS/Android; en Web el usuario ya tiene teclado físico, un teclado en pantalla no aporta nada. `TextInput` gana `showSoftInputOnFocus={!SHOW_TECLADO}` (prop real de RN, iOS/Android) — desactiva el teclado nativo del sistema solo donde se muestra el `Teclado` propio, dejándolo como única vía de edición (incluido borrar). `handleKeyPress(key)` sincroniza cada pulsación con el input controlado: `TECLADO_BACKSPACE` borra el último carácter (`value.slice(0, -1)`), cualquier otro valor se añade al final -- sin seguimiento de posición de cursor (judgment call, suficiente para un teclado de solo-añadir/borrar, no se pidió edición en medio del texto). Estado del modo básica/científica vive local a `ResolutionModeForm` (puramente de UI, no necesita subir a `SessionScreen` ni al store).

**Output generado**: `src/screens/SessionScreen.tsx`/`.styles.ts` actualizados. Sin tests nuevos — wiring de UI sobre componentes ya presentacionales. `npx turbo run typecheck lint test` → en verde, 59/59 tests en `mobile-app` (sin cambios de cantidad). Verificado con bundle real (`expo export --platform web`) — confirma que en el bundle Web el `Teclado` no se renderiza (rama `Platform.OS !== 'web'` resuelta en build time).

---

## 2026-08-11 — Componentes `Tecla`/`Teclado` (teclado matemático reutilizable, sin cablear todavía)

**Input**: el usuario pidió dos componentes nuevos, `Tecla` y `Teclado`, con dos modos (calculadora básica: dígitos, `+-*/.()`; calculadora científica) y un atributo en `Teclado` para conmutar entre ambos.

**Decisión tomada**: `Tecla` (`src/components/Tecla/`) — presentacional puro (`label`/`value`/`onPress`/`variant`/`disabled`/`flex`), `value` opcional distinto de `label` para teclas cuyo glifo mostrado no es lo que se inserta (p. ej. "⌫" inserta el sentinel `TECLADO_BACKSPACE`, "sin" inserta `"sin("`). `Teclado` (`src/components/Teclado/`) — componente controlado (`mode`/`onModeChange`, mismo patrón que `Combobox`'s `multiSelect`), con conmutador propio dentro del componente (dos botones "Básica"/"Científica") además de ser controlable desde fuera. Modo científica es un **superset** del básico (mismas teclas + funciones), no un layout distinto — igual que una calculadora científica real. Conjunto de funciones científicas (`sin`/`cos`/`tan`/`log`/`√`/`xʸ`/`π`/`%`) es judgment call documentado, acotado a lo relevante para el catálogo de Temas (ADR-006: potencias-raíces, trigonometría, cálculo), no exhaustivo. Tecla de borrar (`⌫`) añadida como necesidad práctica mínima no pedida explícitamente — sin ella el teclado no permite corregir un error de tecleo.

**Sin cablear a ninguna pantalla todavía** — el usuario pidió los componentes, no su integración; `SessionScreen`'s `ResolutionModeForm` sigue usando `TextInput` nativo. Candidato obvio para sustituirlo en una tarea futura, no asumido aquí.

**Output generado**: `src/components/Tecla/{Tecla.tsx,Tecla.styles.ts,index.ts}`, `src/components/Teclado/{Teclado.tsx,Teclado.styles.ts,index.ts}` (nuevos), `src/components/index.ts` actualizado. Sin tests — presentacional puro sin lógica de rama no trivial que extraer (mismo criterio que `Checkbox`/`RadioButton`). `npx turbo run typecheck lint test` → en verde, 59/59 tests en `mobile-app` (sin cambios de cantidad).

---

## 2026-08-11 — Backoff ante 429 en `generate:exercises` + fix de prompt (Modo Test)

**Input**: el usuario pidió una batería de ejercicios (3 por tipo/modo) para el catálogo completo. Al ejecutar el lote (216 llamadas), el 96% falló con `429` — Gemini (plan gratuito) tiene un límite de peticiones/minuto muy bajo y el script no tenía pausa ni reintento (`GenerateExerciseBatchUseCase`/`QwenClient` tampoco reintentan errores de transporte, solo violaciones de invariante). Consultado el usuario (`AskUserQuestion`), eligió añadir backoff y relanzar el catálogo completo.

**Decisión tomada**: `generateExerciseBatch.ts` — pausa fija entre llamadas (`EXERCISE_BATCH_DELAY_MS`, default 3000ms) + reintento con backoff exponencial *solo* ante errores con `status === 429` (`EXERCISE_BATCH_RATE_LIMIT_RETRIES`/`_DELAY_MS`, defaults 5 intentos / 10000ms base, doblando cada vez). Otros errores (p. ej. invariante de `Exercise` violada tras los reintentos internos del propio UseCase) no se reintentan aquí, se cuentan como fallo y se continúa — el backoff es específicamente para rate limiting de transporte, no para calidad del contenido generado.

**Segunda petición, en paralelo con el lote ya en marcha**: el usuario pidió corregir el prompt de Modo Test — los enunciados generados empezaban con frases redundantes ("Calcula mentalmente...", "Resuelve mentalmente..."), pese a que toda la app ya es de cálculo mental (contexto implícito). `buildGenerateExercisePrompt` (`apps/ai-engine/src/prompts/GenerateExercise.ts`) ahora instruye explícitamente, solo para `type === 'Test'`: el `statement` debe ser únicamente la operación/problema, sin esas frases introductorias. Sin test roto (ningún test existente asertaba el contenido literal del prompt). **El lote ya en ejecución sigue usando el prompt antiguo** (el proceso Node no recarga módulos en caliente) — consultado el usuario, eligió dejarlo terminar así en vez de perder el progreso ya hecho y volver a quemar cuota desde cero; los enunciados con la frase redundante son funcionalmente válidos, solo el estilo no es el pedido.

**Output generado**: `apps/backend-api/src/scripts/generateExerciseBatch.ts` (backoff), `apps/backend-api/.env.example` (`EXERCISE_BATCH_DELAY_MS`/`_RATE_LIMIT_RETRIES`/`_RATE_LIMIT_DELAY_MS`), `apps/ai-engine/src/prompts/GenerateExercise.ts` (instrucción de Modo Test). `npx tsc --noEmit`/`eslint`/`vitest` → limpio en `backend-api`/`ai-engine` (15/15 tests en `ai-engine`, sin cambios de cantidad).

---

## 2026-08-11 — Refinamiento de UX de `SessionScreen`: `RadioButton`, botón fusionado, icono de pista

**Input**: el usuario pidió 4 ajustes de diseño sobre la pantalla de sesión ya construida: (Resolución) "Pedir pista" como icono `?` junto al enunciado; "Enviar respuesta"/"Resolver" fusionados en un único botón cuya acción/label cambia según haya texto escrito; "Siguiente ejercicio" al mismo nivel que "Finalizar"; confirmar que pistas/solución se limpian al pasar de ejercicio. (Test) componente `RadioButton` reutilizable para las 3 opciones.

**Decisión tomada**: `RadioButton` (`src/components/RadioButton/`) — presentacional puro (`selected`/`onPress`/`label`), círculo+punto sin icon library, mismo patrón que `Checkbox`. `TestModeOptions` lo usa para las 3 opciones, con `selectedOption` como estado local nuevo en `SessionScreen` (antes no se rastreaba qué opción se había pulsado, el envío era instantáneo sin marcar visualmente la elección). `ResolutionModeForm` pierde `onRequestHint`/`hintsEnabled` (el botón de pista sale de su interior) y fusiona sus dos botones en uno: `value.trim().length > 0 ? 'Enviar respuesta' : 'Resolver'`, mismo `onPress` condicional. El icono `?` de pista se renderiza directamente en `SessionScreen` dentro de una fila junto a `exercise.statement` (`statementRow`), solo en Modo Resolución. "Siguiente ejercicio" se mueve de un botón a ancho completo al final de la card a un botón pequeño en `topRow`, junto a "Finalizar" (mismo contenedor `topRowActions`).

**Limpieza de pistas/solución entre ejercicios**: ya funcionaba correctamente antes de este cambio (`useEffect` sobre `exercise?.id` ya reseteaba `result`/`submittedValue`, y `setExercise` en el store ya reseteaba `hints: []`) — se añadió `setSelectedOption(null)` al mismo efecto para que el nuevo estado de selección de Test también arranque limpio, sin cambiar el mecanismo ya existente.

**Output generado**: `src/components/RadioButton/{RadioButton.tsx,RadioButton.styles.ts,index.ts}` (nuevo), `src/components/index.ts` actualizado, `src/screens/SessionScreen.tsx`/`.styles.ts` reescritos. Sin tests nuevos — cambio de UI puro sobre lógica ya testeada (`computeTimerState`/`pickMentalMathTip`/`useTrainingSessionStore` sin tocar). `npx turbo run typecheck lint test` → en verde, 59/59 tests en `mobile-app` (sin cambios de cantidad). Verificado con bundle real (`expo export --platform web`, sin errores).

---

## 2026-08-11 — Script `generate:exercises` (UC-001, wiring real) + fix de config Gemini

**Input**: el usuario cambió `AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL_NAME` de DeepSeek a Gemini para evitar el 402 de saldo (hallazgo Security 2026-08-10), pero seguía viendo "No se pudo iniciar la sesión. Inténtalo de nuevo o elige otro tema." al probar `HomeScreen`.

**Diagnóstico (antes de tocar nada)**: reproducido con `curl` directo contra `POST /sessions` (esa ruta expone el mensaje real, `exposeMessage=true`) — con el Tema `arit.suma-resta` funciona (200), con cualquier otro Tema falla con `"No exercises available for topic <X> at <nivel> near rating <r>"`. Causa real: en toda la BBDD solo existía **un** `Exercise` (el seed manual de `main.ts`) — `StartSessionUseCase`/`SelectNextExerciseUseCase` son deterministas (UC-008), nunca llaman al LLM, así que cambiar de proveedor de IA no podía arreglar este error. `GenerateExerciseBatchUseCase` (UC-001) existía en `ai-engine`, testeado, pero **nunca se exportaba desde el barrel del paquete ni tenía ningún script que lo invocara** (a diferencia de `IngestKnowledgeBaseUseCase`/`ingest:rag`) — el Pool nunca podía crecer. Consultado el usuario (`AskUserQuestion`): construir el script ahora.

**Decisión tomada**: `apps/ai-engine/src/index.ts` exporta ahora `GenerateExerciseBatchUseCase`. Nuevo `apps/backend-api/src/scripts/generateExerciseBatch.ts` (`npm run generate:exercises`), mismo patrón que `ingestKnowledgeBase.ts`: compone adaptadores reales (`PrismaExerciseRepository`, `PostgresKnowledgeBaseIndex`+`XenovaEmbedder`, `LangChainChatModel`+`QwenClient`), sin test automático (wiring puro, depende de red/DB real, mismo criterio que el resto de scripts/composition roots). Alcance configurable por variables de entorno opcionales (`EXERCISE_BATCH_TEMA`/`_LEVEL`/`_TYPE`/`_COUNT`) — sin ellas, genera para el catálogo `TEMA_CATALOG` completo (23 Temas × niveles × Test/Resolution), deliberadamente no automático por defecto en la práctica (se documenta el coste en el propio script) para no quemar cuota del LLM sin querer en una prueba acotada.

**Hallazgo real durante la verificación — config de Gemini mal formada, no relacionada con el script**: al ejecutar el script acotado a un combo (`arit.fracciones`/Primaria/Resolution), el error real (no enmascarado, es un script CLI, no una ruta HTTP) fue `404 ... MODEL_NOT_FOUND`. Revisado `.env`: `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/interactions` — ruta inexistente en la API de Gemini. Corregido a `https://generativelanguage.googleapis.com/v1beta/openai` (el endpoint real compatible con OpenAI que documenta Google). Reejecutado: **generó un `Exercise` real** (`arit.fracciones`/Primaria/Resolution). Backend reiniciado con la config corregida; verificado end-to-end por `curl`: `POST /sessions` con `arit.fracciones` → 200 con el ejercicio recién generado; `POST /hints` sobre esa sesión → pista real generada por Gemini (antes bloqueada por el 402 de DeepSeek, ahora funcional).

**Output generado**: `apps/ai-engine/src/index.ts` (export nuevo), `apps/backend-api/src/scripts/generateExerciseBatch.ts` (nuevo), `apps/backend-api/package.json` (`generate:exercises`), `apps/backend-api/.env.example` (`EXERCISE_BATCH_*` documentadas), `apps/backend-api/.env` (`AI_BASE_URL` de Gemini corregida). `npx tsc --noEmit`/`eslint` → limpio en `backend-api`/`ai-engine`. `vitest run --exclude NodeIngestionFileSystem.test.ts` → 91/91 en verde en `backend-api` (sin tests nuevos, mismo criterio que `ingestKnowledgeBase.ts`). Verificado en vivo: 1 `Exercise` generado por Gemini, flujo `/sessions`→`/hints` completo con el Tema nuevo.

---

## 2026-08-11 — `app/(app)/session/[sessionId].tsx` (US-004/US-005/US-006-acción, TDD Red→Green)

**Input**: el usuario pidió definir y luego construir la pantalla de sesión. Definición cerrada en dos rondas de `AskUserQuestion` (ver conversación): (1) sin endpoint nuevo para "ejercicio actual" — se pasa de Home a la pantalla vía estado de cliente; (2) en Modo Resolución, expirar el tiempo solo desbloquea pistas, no auto-envía; (3) botón "Finalizar" siempre visible; (4) resumen de `POST /sessions/end` sembrado en TanStack Query. Ronda 2 añadió: nota de cálculo mental en Modo Test (contenido genérico, no IA), y botón "Resolver" en Resolución que revela la solución **enviando el intento como incorrecto** (`submittedValue` vacío) — mismo mecanismo que un fallo normal, sin endpoint nuevo. Ambas extensiones documentadas primero como AC nuevas en US-004/US-005 (Product) antes de escribir código.

**Decisión de arquitectura — `useTrainingSessionStore` (Zustand)**: el "ejercicio actual" de una `Session` no tiene ningún GET real (`Session`, dominio, no lo trackea) — solo llega vía la respuesta de `POST /sessions` o `POST /answers`. ADR-015 ya fijaba "el cronómetro del ejercicio en curso" en Zustand; se extiende ese mismo store de estado-de-cliente para incluir `sessionId`/`mode`/`currentExercise`/`exerciseShownAt`/`hints` en vez de crear una entrada de caché de TanStack Query sin `queryFn` real. Si el usuario entra directo a la URL o recarga sin haber pasado por Home (`sessionId` de la ruta no coincide con el del store), `SessionScreen` redirige a Home — hueco de arquitectura aceptado y documentado, no resuelto con backend nuevo en esta tarea.

**Lógica pura (TDD)**: `SessionScreen.timer.ts` (`computeTimerState`, 4/4 tests — remainingMs/expired a partir de `exerciseShownAt`+`timeLimitMs`+`now`, `now` como parámetro para poder testear sin temporizadores reales); `SessionScreen.mentalMathTips.ts` (`pickMentalMathTip`, 4/4 tests — selección determinista por `Exercise.id`, mismo ejercicio siempre misma nota); `useTrainingSessionStore.ts` (5/5 tests, mismo patrón que `useSessionStore.test.ts`).

**`SessionScreen.tsx`**: refactorizado en 3 subcomponentes locales (`TestModeOptions`, `ResolutionModeForm`, `ResultBanner`) para bajar la complejidad ciclomática de la función principal (27→16, aviso de SonarLint del IDE, no bloqueante en `eslint .`) — resto de complejidad aceptado como inherente a las ramas de UI (Test/Resolución/resultado/errores/pool agotado), sin fragmentar más. Modo Test: 3 opciones + nota de cálculo mental siempre visible; timeout → auto-envío vacío (con guarda `autoSubmittedRef` para no disparar el envío más de una vez mientras el intervalo de 250ms sigue corriendo). Modo Resolución: input libre + "Enviar respuesta" + "Resolver" (ambos mismo mecanismo, `handleSubmit`) + "Pedir pista" (habilitado solo tras expirar). "Finalizar" siempre visible → siembra `queryKeys.sessionSummary(sessionId)` y limpia el store antes de navegar.

**`HomeScreen.tsx`**: `onSuccess` de `useStartSession` ahora llama a `useTrainingSessionStore().start(...)` antes de navegar.

**Hueco de entorno, no de código — `expo-router` tipos desactualizados**: `router.push('/(app)/session/...')`/`router.replace('/(app)/home')` necesitan `@ts-expect-error` pese a que ambas rutas ya existen de verdad — `expo start` sigue bloqueado por el `EACCES` de Windows (Modo de desarrollador desactivado, ya documentado), así que `.expo/types/router.d.ts` nunca se regeneró desde antes de construir `(app)/home.tsx`. Se autolimpiarán en cuanto `expo start` funcione en un entorno sin ese bloqueo.

**Hallazgo real, ajeno al código — cuenta de DeepSeek sin saldo**: verificado el flujo completo con `curl` contra el backend real (`POST /sessions` → `POST /answers` → `POST /sessions/end`, DTOs exactos a los que consume `SessionScreen`, correctos). `POST /hints` devolvía `"Forbidden or invalid session"` pese a una sesión válida y activa — diagnosticado con un script aislado (fuera de `routes.ts`, que enmascara cualquier error de esa ruta con el mensaje genérico por diseño, hallazgo de Security 2026-08-07) que invoca `GenerateHintUseCase` directamente: el error real es `APIError: 402 Insufficient Balance` de la API de DeepSeek (`AI_API_KEY` configurada en `.env`, sin saldo). No es un bug de `GenerateHintUseCase`/`HintController` (8/8 y 2/2 tests ya en verde, sin tocar), ni de `SessionScreen` (la petición que envía es correcta) — es un problema de cuenta/facturación externo, fuera del alcance de esta tarea. Señalado directamente al usuario, no solo en esta traceability.

**Output generado**: `docs/user-stories/{US-004-resolver-ejercicio,US-005-solicitar-pista}.md` (AC nuevas), `apps/mobile-app/src/screens/{SessionScreen.tsx,SessionScreen.styles.ts,SessionScreen.timer.ts,SessionScreen.timer.test.ts,SessionScreen.mentalMathTips.ts,SessionScreen.mentalMathTips.test.ts}`, `apps/mobile-app/src/store/{useTrainingSessionStore.ts,useTrainingSessionStore.test.ts}`, `apps/mobile-app/app/(app)/session/[sessionId].tsx` (nuevo), `apps/mobile-app/src/api/queryKeys.ts` (`sessionSummary`), `apps/mobile-app/src/screens/HomeScreen.tsx` (wiring). 13/13 tests nuevos. `npx turbo run typecheck lint test` → en verde (59/59 tests en `mobile-app`, antes 46). Verificado con bundle real (`expo export --platform web`, sin errores) y flujo E2E real de `/answers`+`/sessions/end` por `curl`; `/hints` verificado por contrato (tests) pero no end-to-end en vivo, bloqueado por el saldo de DeepSeek.

---

---
task_id: STATUS-050
date: 2026-08-10
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-10 — Background base en `HomeScreen`

**Input**: el usuario pidió añadir el background base a la pantalla Home — corrige la decisión anterior (misma sesión) de dejar `HomeScreen` sin `BackgroundGrid`/`ParticleField` propio.

**Decisión tomada**: `<BackgroundGrid />` añadido (la rejilla, identidad visual mínima de la app), **sin** `ParticleField` — las letras griegas flotantes competirían visualmente con un formulario interactivo que ya abre un `Modal` (`Combobox`) encima, a diferencia de `Login`/`RegisterScreen`, pantallas de una sola acción. Judgment call documentado en la memoria del proyecto: si el usuario pide también las partículas, es un cambio de una línea (`<ParticleField />` junto a `BackgroundGrid`).

**Output generado**: `HomeScreen.tsx` actualizado. `npx turbo run typecheck lint test` → en verde, 46/46 tests en `mobile-app` (sin cambios de cantidad — cambio visual). Verificado con bundle real (`expo export --platform web`, sin errores).

---

---
task_id: STATUS-049
date: 2026-08-10
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-10 — Scroll formal al diseño de la app (`global.css` + `indicatorStyle`)

**Input**: el usuario pidió formalizar el estilo de los scrolls al diseño principal de la app. Explorado primero (agente Explore) para no adivinar: solo 2 elementos scrollables existen hoy en todo `mobile-app` (`HomeScreen`'s `ScrollView`, `Combobox`'s `FlatList`), sin ningún CSS ni fichero de tema central previo — solo `COLORS` en `NeuralLoader/constants.ts`.

**Decisión tomada**: `src/styles/global.css` (nuevo) — scrollbar temático solo-Web (`scrollbar-width`/`scrollbar-color` + `::-webkit-scrollbar*`, colores calcados de `COLORS.ice`/`COLORS.background`, sin poder importar el módulo TS desde CSS puro — documentado el riesgo de desincronización si la paleta cambia). Importado una única vez en `app/_layout.tsx` (aplica a toda la app, no por pantalla) — confirmado que `@expo/metro-config` (Expo SDK 57, ya instalado) trae transformer de CSS nativo antes de escribir nada (`build/transform-worker/css.js`, `postcss.js`), sin dependencia nueva. Convención nativa complementaria (`indicatorStyle="white"`) aplicada a los 2 `ScrollView`/`FlatList` existentes — CSS no tiene efecto en iOS/Android, y el indicador gris por defecto de iOS es casi ilegible sobre el fondo oscuro de la app; Android no expone una API de color de scrollbar equivalente, aceptado como límite nativo. Documentado como convención a seguir en `src/styles/README.md` (nuevo) para cualquier `ScrollView`/`FlatList` futuro.

**Verificado con bundle real** (`expo export --platform web`): Metro genera un bundle CSS real (`_expo/static/css/global-*.css`, 298B minificado) enlazado en `index.html` (`<link rel="stylesheet">`), contenido confirmado con el color `#4cc9f0` correcto. `npx turbo run typecheck lint test` → en verde (46/46 tests en `mobile-app`, sin cambios de cantidad — cambio puramente visual/CSS, sin lógica nueva que testear).

**Output generado**: `src/styles/{global.css,README.md}` (nuevos), `app/_layout.tsx` (import), `HomeScreen.tsx`/`Combobox.tsx` (`indicatorStyle="white"`).

---

---
task_id: STATUS-048
date: 2026-08-10
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-10 — `Checkbox`/`Combobox` genéricos (TDD Red→Green), `HomeScreen` usa `Combobox` para Tema

**Input**: el usuario pidió un Combobox reutilizable para listar Temas, con un atributo `multi-select` (uno o varios items) y un checkbox de "seleccionar/deseleccionar todos" marcado a `true` por defecto para Temas, más un Checkbox personalizado para las filas. Aclarado antes de implementar (`AskUserQuestion`): eso contradice directamente US-003 ("se asume un tema por sesión", multi-tema explícitamente fuera de alcance) y `StartSessionRequestDto.topic` (un único `TemaCode`, no un array). El usuario eligió: construir `Combobox`/`Checkbox` como componentes genéricos reutilizables de verdad (con soporte real de `multiSelect`), pero `HomeScreen` sigue usándolo en modo single-select — sin tocar US-003 ni el backend.

**Decisión tomada**: `Checkbox` (`src/components/Checkbox/`) — presentacional puro (`checked`/`onChange`/`label`), glifo Unicode `✓` sin icon library nueva (mismo criterio que `AcademicLevelStars`/`PasswordInput`). `Combobox<T>` (`src/components/Combobox/`) — genérico sobre cualquier `T` vía `getKey`/`getLabel`, props como unión discriminada por `multiSelect` (`ComboboxSingleProps<T>` con `value`/`onChange(key)` vs `ComboboxMultiProps<T>` con `values`/`onChange(keys)` + `selectAllDefault`), trigger + panel en un `Modal` transparente (evita problemas de recorte/z-index con el `ScrollView` que ya envuelve `HomeScreen`, y funciona igual en `react-native-web`). Lógica de selección extraída a `Combobox.logic.ts` (TDD, 8/8 tests: `toggleSelection`, `isAllSelected`, `toggleSelectAll`) — mismo patrón que `sessionRouting.ts`/`HomeScreen.validation.ts`, pura y testeable sin renderizar React. `selectAllDefault` preselecciona el catálogo completo solo si `values` sigue vacío al montar/cambiar el catálogo — sigue siendo un componente controlado, no introduce estado no controlado.

**`HomeScreen`**: el selector de Tema (antes una lista inline `ScrollView`+`TouchableOpacity`) pasa a `<Combobox items={sortedTemas} multiSelect={false} value={topic} onChange={setTopic} .../>` — mismo comportamiento observable (un único Tema), UI nueva. `getLabel` incluye el área entre corchetes (`[arit] Suma y resta`) para no perder la información que antes mostraba como badge aparte. Estilos `topicList`/`topicRow`/etc. de `HomeScreen.styles.ts` eliminados (viven ahora en `Combobox.styles.ts`).

**Problemas reales encontrados y corregidos, no relacionados con el diseño**: (1) `StyleSheet.absoluteFillObject` no existe en la versión de tipos de `react-native` de este proyecto (`tsc` sugería `absoluteFill`) — sustituido por un objeto de posición absoluta explícito en `Combobox.styles.ts`, sin depender de esa API. (2) Un comentario `// eslint-disable-next-line react-hooks/exhaustive-deps` causaba un error de lint real (`Definition for rule 'react-hooks/exhaustive-deps' was not found`) — el plugin `eslint-plugin-react-hooks` no está instalado/configurado en este proyecto, así que la regla ni se evalúa; quitado el comentario (innecesario sin el plugin).

**Output generado**: `src/components/Checkbox/{Checkbox.tsx,Checkbox.styles.ts,index.ts}`, `src/components/Combobox/{Combobox.tsx,Combobox.styles.ts,Combobox.logic.ts,Combobox.logic.test.ts,index.ts}`, `src/components/index.ts` actualizado, `src/screens/HomeScreen.tsx`/`.styles.ts` actualizados. 8/8 tests nuevos (`Combobox.logic.test.ts`). `npx turbo run typecheck lint test` → en verde (46/46 tests en `mobile-app`, antes 38). Verificado con bundle real (`expo export --platform web`, sin errores) servido junto al `backend-api` real.

---

---
task_id: STATUS-047
date: 2026-08-10
agentes: [developer]
flujo: [architecture, developer, security]
estado: done
---

## 2026-08-10 — CORS con allowlist (`CORS_ALLOWED_ORIGINS`, TDD Red→Green)

**Input**: continuación tras la adenda de Architecture sobre ADR-012 (CORS). Cierra el bloqueo real que el usuario encontró al probar el registro desde el navegador.

**Contexto utilizado**: `apps/backend-api/src/presentation/main.ts` (composition root, sin CORS montado hasta ahora), paquete `cors` (Express, estándar de facto — no una reimplementación manual).

**Decisión tomada**: `corsConfig.ts` — dos funciones puras, TDD (8/8 tests): `parseAllowedOrigins(raw)` (separa por comas, recorta espacios, descarta vacíos; `[]` si la variable no está definida) e `isOriginAllowed(origin, allowedOrigins)` (`true` si `origin` es `undefined` — peticiones sin cabecera `Origin`, no-navegador, no les aplica CORS — o si está en la allowlist; `false` en cualquier otro caso, incluida una allowlist vacía — rechazo por defecto, no permisivo). `main.ts` monta `cors({ origin: (origin, cb) => cb(null, isOriginAllowed(origin, ALLOWED_ORIGINS)) })` antes de `express.json()`/las rutas, con un `console.warn` si `CORS_ALLOWED_ORIGINS` no está definida (config incompleta detectable en el log, no un fallo silencioso).

**Problema real encontrado y corregido de paso, no relacionado con CORS**: `npm install cors @types/cors --workspace=apps/backend-api` rompió la dependencia opcional nativa de Rollup (`Cannot find module @rollup/rollup-win32-x64-msvc`, bug conocido de npm con optionalDependencies en Windows, https://github.com/npm/cli/issues/4828) — `vitest` dejó de arrancar en todo el monorepo. Corregido con `npm install @rollup/rollup-win32-x64-msvc --no-save` (reinstala el binario nativo sin tocar `package.json`/`package-lock.json`, ya declarados correctamente). El `npm install` (raíz, sin argumentos) ejecutado durante el diagnóstico reescribió `package-lock.json` de forma extensa (~2200 líneas) — revisado que el diff de `apps/backend-api/package.json` en sí solo añade `cors`/`@types/cors`, sin más cambios de versión deliberados.

**Hallazgo no relacionado, detectado al correr la suite completa**: `NodeIngestionFileSystem.test.ts` (2/3 tests) falla por separadores de ruta (`/` esperado vs `\` real de `path.join` en Windows) — pertenece a un cambio ya en curso y sin commitear en el árbol de trabajo (comentario propio del archivo: "Hallazgo de la verificacion DevOps 2026-08-10", fallback EXDEV para bind mounts de Docker) que esta tarea no toca ni introduce. Confirmado aislando la suite (`--exclude NodeIngestionFileSystem.test.ts` → 91/91 en verde, exactamente 83 previos + 8 nuevos de `corsConfig`). No corregido aquí — no es substancia de esta tarea y el archivo pertenece a trabajo en curso de otra sesión/tarea (Docker/ADR-016), visible desde el inicio de esta conversación como cambios ya presentes sin commitear.

**Verificado manualmente con servidor real** (`CORS_ALLOWED_ORIGINS=http://localhost:8081` en `.env`): preflight `OPTIONS` con `Origin: http://localhost:8081` → `204` + `Access-Control-Allow-Origin: http://localhost:8081`; mismo preflight con `Origin: https://evil.example.com` → sin ninguna cabecera `Access-Control-Allow-*` (el navegador lo bloquearía; `curl` no aplica CORS, por eso el body sigue viéndose, comportamiento esperado); `POST /auth/register` real con origen permitido → `200` con la cabecera presente; petición sin `Origin` (`GET /health`) → `200` sin restricción.

**Output generado**: `apps/backend-api/src/presentation/http/corsConfig.ts`+`.test.ts` (nuevo), `main.ts` (wiring), `package.json` (`cors`, `@types/cors`), `.env.example`/`.env` (`CORS_ALLOWED_ORIGINS`). `npx turbo run typecheck lint` → limpio. `vitest run --exclude NodeIngestionFileSystem.test.ts` → 91/91 en verde (backend-api).

---

---
task_id: STATUS-046
date: 2026-08-10
agentes: [developer]
flujo: [architecture, developer, security]
estado: done
---

## 2026-08-10 — `GET /temas` (backend, TDD Red→Green) + `(app)/home.tsx` (US-003)

**Input**: continuación tras la adenda de Architecture (ver `.ai/prompts/architecture.md`) que resuelve el hueco del catálogo de Temas. El usuario eligió la opción de endpoint real; esta entrada implementa ambas mitades (backend nuevo + pantalla que lo consume).

**Backend (TDD Red→Green)**: `TemaRepository.findAll()` (puerto) + `InMemoryTemaRepository.findAll()`. `TemaDto`/`GetTemasResponseDto` en `shared-types`. `ListTemasUseCase` (Application, delega en `findAll()`) y `TemaController.listTemas()` (Presentation, mapea a DTO) — ambos con `declare class` en Red, confirmado fallando (`ListTemasUseCase is not a constructor`) antes de implementar. `GET /temas` cableado en `routes.ts` (mismo patrón `requireAuth` que el resto) y `main.ts` (nuevo `TemaController`). `infrastructure/seed/temaCatalog.ts`: los 23 Temas reales de ADR-006 transcritos como `TEMA_CATALOG`, sustituyendo el seed mínimo de 1 Tema — `main.ts` lo usa tanto para `TemaRepository` como (sin cambio) para el `Exercise` semilla existente (`arit.suma-resta` sigue en el catálogo real). 4/4 tests nuevos verdes, `npx turbo run typecheck lint test` → 83/83 tests en `backend-api`. Verificado manualmente con servidor real (`JWT_SECRET` de prueba): `GET /temas` → 23 Temas, 401 sin token; `POST /sessions` con `topic: "arit.fracciones"` ya no falla por "Tema inválido" (falla por falta de `Exercise` para ese tema, esperado — el pool de ejercicios es un hueco de contenido distinto, no de este catálogo); `POST /sessions` con `topic: "arit.suma-resta"` completa el flujo end-to-end.

**mobile-app — `useTemas`** (TDD Red→Green para `getTemasRequest`, wiring sin test para el hook, mismo criterio que `useStatistics`): `staleTime: Infinity` — catálogo de referencia, no cambia durante la sesión de la app, evita refetch innecesario.

**`AcademicLevelStars` extraído de `RegisterScreen`**: al convertirse `HomeScreen` en el segundo consumidor del selector de estrellas de nivel, se extrae a `src/components/AcademicLevelStars/` (presentacional puro, `value`/`onChange`/`label`/`error`) — mismo criterio de extracción ya aplicado a `EmailInput`/`PasswordInput` (STATUS #44: duplicado en dos pantallas → componente compartido). `RegisterScreen.tsx`/`.styles.ts` refactorizados para consumirlo; sin cambio de comportamiento (5/5 tests de `RegisterScreen.validation` sin tocar).

**`HomeScreen` (US-003, TDD Red→Green para la lógica pura)**: `HomeScreen.validation.ts` — `temasForLevel()` (filtra el catálogo completo por `AcademicLevel`, ya que `GET /temas` no filtra server-side) y `validateHomeForm()` (mode/academicLevel/topic obligatorios; el escenario "Tema inexistente" de US-003 se cubre estructuralmente: el topic debe estar en la lista ya filtrada, no solo ser no-nulo). 8/8 tests, primer intento. Nivel académico preseleccionado desde `useUserStatistics().data.academicLevel` (US-003, "Nivel académico por defecto") vía `useEffect` guardado por `academicLevel === null` -- se preselecciona una sola vez, no pisa una elección posterior del usuario si la query se revalida. Cambiar de nivel limpia el `topic` elegido (evita un topic invisible-pero-guardado que solo se detectaría al confirmar). Sin fondo propio (`BackgroundGrid`/`ParticleField`) a diferencia de `Login`/`RegisterScreen` -- vive bajo `AppHeader` dentro del guard de `(app)`, que ya fija el fondo oscuro del layout autenticado (judgment call, documentado también en la memoria del proyecto). Navega a `/(app)/session/<sessionId>` al confirmar (`@ts-expect-error`, ruta todavía sin construir, mismo patrón que el resto de la sesión).

**Hueco de entorno detectado, no de código**: `npx expo start --web` falla de forma determinista y reproducible (3 intentos, puertos distintos) con `EACCES: permission denied, lstat '...node_modules\.bin\{tsc,tsserver}'` desde el `FallbackWatcher` de Metro -- un problema de permisos de symlink de Windows (probablemente Developer Mode desactivado o interferencia de antivirus sobre los symlinks de `.bin`), no relacionado con ningún cambio de esta tarea. Verificado en su lugar con `npx expo export --platform web` (bundle real, 1251 módulos, sin errores) servido con `npx serve` en `:8081` contra el `backend-api` real en `:3000` -- el usuario puede visualizar la pantalla real navegando a `/register` o `/login` y dejándose redirigir por el guard. Consecuencia menor: `.expo/types/router.d.ts` no se regeneró (requiere `expo start` activo), así que los `@ts-expect-error` de `AppHeader`/`index.tsx`/`HomeScreen` hacia `/(app)/home` y `/(app)/session/...` siguen ahí aunque `(app)/home.tsx` ya existe -- inocuo (`tsc` no se queja), se autolimpiarán en cuanto alguien ejecute `expo start` con éxito en un entorno sin este bloqueo.

**Output generado**: backend — `packages/shared-domain/src/repositories/TemaRepository.ts`, `packages/shared-testing/src/mocks/InMemoryTemaRepository.ts`, `packages/shared-types/src/dtos/Tema.ts` (+ `index.ts`), `apps/backend-api/src/application/use-cases/ListTemasUseCase.ts`+`.test.ts`, `apps/backend-api/src/presentation/http/TemaController.ts`+`.test.ts`, `routes.ts`, `main.ts`, `infrastructure/seed/temaCatalog.ts`. mobile-app — `src/api/requests/tema.ts`+`.test.ts`, `src/api/hooks/useTemas.ts`, `queryKeys.ts`/`index.ts` actualizados, `src/components/AcademicLevelStars/{AcademicLevelStars.tsx,.styles.ts,index.ts}`, `src/screens/{HomeScreen.tsx,HomeScreen.styles.ts,HomeScreen.validation.ts,HomeScreen.validation.test.ts}`, `app/(app)/home.tsx`, `RegisterScreen.tsx`/`.styles.ts` refactorizados. `npx turbo run typecheck lint test` → **32/32 tareas en verde** en todo el monorepo (38/38 tests en `mobile-app`, antes 29; 83/83 en `backend-api`, antes 79).

---

---
task_id: STATUS-045
date: 2026-08-10
agentes: [developer]
flujo: [developer, security]
estado: done
---

## 2026-08-10 — `app/(app)/_layout.tsx`: guard de autenticación + header global (TDD Red→Green)

**Input**: el usuario pidió continuar con la siguiente pantalla de `mobile-app`; consultado por `AskUserQuestion` sobre cuál construir primero de las cuatro restantes (Home/Ejercicio/Resumen/Estadísticas), eligió el guard/header de `(app)` por ser prerrequisito de las cuatro (ADR-015).

**Contexto utilizado**: `docs/ADR/ADR-015_mobile_app_screens.md` (diseño ya fijado del guard + header global), `useSessionStore.ts`/`createTokenStorage.ts` (ya implementados desde #35/#36, `hydrate()` sin cablear todavía), `useUserStatistics` (ya implementado desde #37, con `queryKeys.statistics` pensada para compartirse).

**Decisión tomada**: `resolveSessionRoute` (`src/store/sessionRouting.ts`) como función pura única, reutilizada por el guard y por `app/index.tsx` — evita repetir el `if/else` de `isHydrated`/`sessionToken` en dos sitios y modela explícitamente el estado `'loading'` (sin el cual un usuario con sesión válida vería un salto visual a login mientras la persistencia responde). `AppHeader` sin test (presentacional puro), reutilizando `useUserStatistics` con la misma query key que usará `(app)/statistics` — sin endpoint nuevo, tal como fija ADR-015.

**Hueco real detectado, no solo lo pedido**: `useSessionStore.hydrate()` llevaba implementada desde #35 pero nunca se había invocado desde ningún componente — sin cablearla, `isHydrated` se habría quedado `false` para siempre y el guard nuevo habría redirigido a login incluso con un `sessionToken` persistido válido. Cableada en `app/_layout.tsx` (`useEffect`, una sola vez al montar `RootLayout`) porque tanto el guard como `app/index.tsx` dependen de ese estado.

**Output generado**: `src/store/sessionRouting.ts`+`.test.ts` (nuevo), `src/components/AppHeader/{AppHeader.tsx,AppHeader.styles.ts,index.ts}` (nuevo), `src/components/index.ts` actualizado, `app/_layout.tsx` (hidratación cableada), `app/(app)/_layout.tsx` (nuevo), `app/index.tsx` (deja de ser placeholder). 3/3 tests nuevos, `npx turbo run typecheck lint test` → 32/32 en verde (29/29 tests en `mobile-app`, antes 26). Verificado con bundle real (`expo start --web`, 1263 módulos, sin errores) y `curl` 200 en `/`, `/login`, `/register`.

---

---
task_id: STATUS-044
date: 2026-08-09
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-09 — `EmailInput`/`PasswordInput`: componentes de input compartidos, sustituidos en Login/Register

**Input**: el usuario pidió un componente de `TextInput` personalizado reutilizable con dos variantes — email (validación de formato, opcionalmente "existencia" para registro) y contraseña (icono de "ojo" que revela el valor en hover/pulsación mantenida) — y sustituirlos en ambas pantallas ya existentes.

**Contexto utilizado**: `LoginScreen.styles.ts`/`RegisterScreen.styles.ts` (bloques `field`/`label`/`input`/`inputError`/`errorText` duplicados byte a byte entre las dos pantallas — la señal real de que este refactor tenía sentido); ADR-012 (el login debe dar un error genérico, nunca confirmar si el email existe) como restricción de diseño para no acoplar `EmailInput` a un chequeo de existencia en red.

**Decisión tomada, tras aclarar con el usuario (AskUserQuestion)**: la "validación de existencia" pedida para el registro no implica una llamada de red nueva ni un endpoint de existencia (eso sería, además, un vector de enumeración de cuentas) — el usuario eligió mostrar solo el error real que ya devuelve el servidor al enviar el formulario. `EmailInput`/`PasswordInput` quedan puramente presentacionales: reciben `value`/`onChangeText`/`error` y no saben nada de validación de formato ni de red — la validación de formato la sigue haciendo cada pantalla (`*.validation.ts`, sin cambios); el error de "email ya registrado" en `RegisterScreen` ahora se enruta específicamente al prop `error` de `EmailInput` (`emailTakenError`, derivado de `register.error.message`), en vez de solo al banner genérico — es la realización concreta de "validar la existencia... como en el caso del registro", distinta de `LoginScreen`, que sigue mostrando el error de servidor solo en el banner genérico (ADR-012: nunca debe indicar si el email existe).

**`PasswordInput`**: revelado por mantener pulsado, no por alternar — `Pressable` combina `onHoverIn`/`onHoverOut` (web) con `onPressIn`/`onPressOut` (touch y ratón), interpretando literalmente "hover o touchscreen" del usuario como mantener, no como un toggle persistente. Glifos Unicode (`👁️`/`🙈`), sin `@expo/vector-icons` nuevo — mismo criterio que las estrellas de `RegisterScreen` y los símbolos de `NeuralLoader`.

**Refactor de estilos**: los bloques `field`/`label`/`input`/`inputError`/`errorText` idénticos de `LoginScreen.styles.ts`/`RegisterScreen.styles.ts` se centralizan en `src/components/inputs/styles.ts` (junto con `passwordRow`/`passwordInput`/`eyeButton`/`eyeIcon`, nuevos). `LoginScreen.styles.ts` los pierde por completo (no le queda ningún campo propio fuera de los dos componentes); `RegisterScreen.styles.ts` conserva `field`/`label`/`errorText` porque el selector de estrellas de nivel de complejidad sigue siendo local a esa pantalla.

**Problema real encontrado y corregido — caché de Metro obsoleta, no un bug de código**: al verificar en el servidor de desarrollo ya corriendo desde tareas anteriores, el bundle fallaba de forma persistente con `Unable to resolve module ./styles from EmailInput.tsx` pese a que el fichero existía en disco con el contenido correcto — a diferencia del error transitorio de `ParticleField` visto en la tarea anterior (que se autocorregía en el siguiente bundle), este error se repitió sin cambiar en decenas de rebundles sucesivos y seguía presente al reanudar la sesión. Diagnosticado como caché de Metro corrompida/desincronizada del proceso de larga duración (Watchman/haste map no recogió los ficheros nuevos). Corregido reiniciando el servidor con caché limpia (`expo start --web -c`); confirmado con un bundle completo limpio (`Web Bundled ... 1329 modules`, cero líneas `ERROR`/`Unable to resolve` en el log) antes de volver a modo watch normal para el resto de la sesión.

**Output generado**: `apps/mobile-app/src/components/inputs/{EmailInput.tsx,PasswordInput.tsx,styles.ts,index.ts}` (nuevos), `src/components/index.ts` actualizado (reexporta ambos). `LoginScreen.tsx`/`RegisterScreen.tsx` actualizados (sustituyen los `TextInput` inline); `LoginScreen.styles.ts`/`RegisterScreen.styles.ts` con los estilos duplicados eliminados. Sin test nuevo — presentacionales puros, mismo criterio ya aceptado para el resto de UI visual de la sesión (26/26 tests de `mobile-app` sin cambios de cantidad, confirmando que ningún comportamiento probado se tocó). `npx turbo run typecheck lint test` → **32/32 en verde** en todo el monorepo. Verificado con bundle real (`node_modules/expo-router/entry.bundle?platform=web`, no solo la ruta HTML) y `curl` 200 en `/login` y `/register`, servidor en modo watch normal.

---

---
task_id: STATUS-043
date: 2026-08-09
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — RegisterScreen (US-001): validador, pantalla real (TDD Green)

**Input**: Red confirmado de `RegisterScreen.validation.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `LoginScreen.tsx`/`.styles.ts` (patrón a replicar: `BackgroundGrid`+`ParticleField`+`card` centrada+`NeuralLoader` como loading state), `useRegister` (ya implementado, `onSuccess` ya escribe la sesión), `RegisterUseCase.ts` (los dos únicos mensajes de error reales, en inglés).

**Decisión tomada**: `RegisterScreen.tsx`/`.styles.ts` replican la estructura de `LoginScreen` casi 1:1, con dos añadidos: selector de nivel académico y `describeRegisterError()`, que traduce el mensaje real del backend a español porque US-001 (a diferencia de US-002) exige un texto concreto, no solo genérico. Enlace de vuelta a `(auth)/login`.

**Problema real encontrado y corregido de paso**: al crear `app/(auth)/register.tsx`, el `@ts-expect-error` que protegía `router.push('/(auth)/register')` en `LoginScreen.tsx` (añadido en la tarea anterior, a propósito para esto) pasó a ser un error real de TypeScript ("directiva no usada") — confirma que elegir `@ts-expect-error` en vez de `as any` fue la decisión correcta: forzó a limpiar la silenciación en el momento exacto en que dejó de hacer falta, sin necesitar acordarse manualmente. Quitada.

**Refactor posterior, misma tarea**: el usuario pidió rediseñar el selector — de 4 chips independientes a 4 estrellas acumulativas (marcar la N-ésima marca también la 1..N-1, el dato es ordinal: "un ingeniero no puede ser sin tener primaria"), con una etiqueta que informa el nivel según la última estrella marcada, y renombrar la label "Nivel académico" → "Nivel de complejidad" (deliberado: evitar asociar lingüísticamente el nivel personal del usuario con el nivel que quiere practicar — mismo dato enviado a la API, solo copy). Estrellas como glifo Unicode (`★`/`☆`), sin icon library nueva — mismo criterio ya aplicado a los símbolos matemáticos de `NeuralLoader` y a evitar un `Picker` nativo.

**Output generado**: `apps/mobile-app/src/screens/{RegisterScreen.tsx,RegisterScreen.styles.ts}`, `app/(auth)/register.tsx`. `LoginScreen.tsx` actualizado (quitado el `@ts-expect-error` ya innecesario). 5/5 tests verdes (los ya confirmados en Red — la lógica de `validateRegisterForm` no cambió con el rediseño del selector, sigue siendo `AcademicLevel | null`). `npx turbo run typecheck lint test` → 32/32 en verde (26/26 tests en `mobile-app`, antes 21). Verificado en navegador real (`http://localhost:8081/register`) — un error transitorio de hot-reload visto en el log del servidor (`ParticleField` `undefined` a mitad de la reconstrucción de commits de la tarea anterior) se autocorrigió y no es reproducible en el estado actual.

---

---
task_id: STATUS-042
date: 2026-08-09
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-09 — LoginScreen: refinamientos de diseño (caja, fondo, registro, recuperar contraseña)

**Input**: El usuario probó `LoginScreen` en el navegador (`npx expo start --web`, primera vez que se arranca el servidor real, no solo `expo export`) y pidió, en la misma sesión: formulario en caja centrada, fondo de partículas del `NeuralLoader` también aquí, botón "Registrarse" arriba a la derecha, enlace de "recuperar contraseña" bajo el botón de enviar.

**Contexto utilizado**: `NeuralLoader/ParticleField.tsx` (ya existía, solo no exportado); `react-native-safe-area-context` (dependencia desde el scaffolding, nunca montada); US-002/ADR-015 (recuperación de contraseña explícitamente "fuera de alcance" — se preguntó al usuario antes de inventar navegación real, AskUserQuestion, eligió texto atenuado sin acción).

**Decisión tomada**: `LoginScreen.styles.ts` gana `card` (caja centrada, `maxWidth: 400`) envolviendo los campos. `ParticleField`/`COLORS`/`BackgroundGrid` reexportados desde `src/components` (antes solo `NeuralLoader`/`BackgroundGrid`/`COLORS`). `app/_layout.tsx` gana `SafeAreaProvider` (mismo patrón que el hueco de `QueryClientProvider` ya documentado) para poder usar `useSafeAreaInsets` en el botón "Registrarse" (`router.push('/(auth)/register')`, `@ts-expect-error` — ruta prevista en ADR-015, aún sin construir, mismo criterio que `/(app)/home`). "¿Olvidaste tu contraseña?" como `Text` puro, sin `onPress` ni ruta — no hay User Story que lo respalde, no se inventa.

**Problema real encontrado y corregido de paso**: al arrancar el servidor de desarrollo real por primera vez (antes solo se había hecho `expo export`, que no activa el mismo flujo), Expo Router generó los tipos de rutas (`experiments.typedRoutes`) y `tsc --noEmit` empezó a fallar en `router.replace('/(app)/home')` — la ruta no existe todavía. No es una regresión de esta tarea, solo la primera vez que se disparaba. Corregido con `@ts-expect-error` (fuerza a TS a avisar — "directiva no usada" — en cuanto la ruta exista de verdad, en vez de una `as any` que quedaría olvidada silenciosamente). De paso, `.gitignore`/`tsconfig.json` de `mobile-app` (generados por Expo CLI: `expo-env.d.ts`, `.expo/types/**/*.ts`) añadidos al repo como configuración real. También corregido `pointerEvents` como prop (deprecado en RN Web) → `style.pointerEvents`, en `ParticleField`/`StatusPill`.

**Output generado**: `LoginScreen.tsx`/`.styles.ts` actualizados. `app/_layout.tsx`, `NeuralLoader/index.ts`, `src/components/index.ts` actualizados. `ParticleField.tsx`/`StatusPill.tsx` (fix `pointerEvents`). `apps/mobile-app/.gitignore` (nuevo), `tsconfig.json` actualizado. Sin test automático (UI visual, mismo criterio que el resto de la sesión). `npx turbo run typecheck lint test` → 32/32 en verde. Verificado en navegador real (`http://localhost:8081/login`).

---

---
task_id: STATUS-040
date: 2026-08-09
agentes: [developer]
flujo: [test, developer]
estado: done
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

---
task_id: STATUS-039
date: 2026-08-09
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-09 — Componente `NeuralLoader` (UI pura, sin ciclo TDD)

**Input**: "implementa el componente" — tras dos rondas de iteración visual sobre un prototipo HTML/CSS/SVG publicado como Artifact (spec de diseño exacta aportada por el usuario; corrección de geometría del cráneo/cerebro; integración del SVG real de cráneo/cerebro aportado por el usuario), el usuario aprobó el diseño y pidió el componente React Native real.

**Contexto utilizado**: el propio prototipo HTML validado (colores, timings de animación, posiciones de zonas/símbolos/anillos en % del contenedor); el SVG de cráneo/cerebro del usuario, con su bounding box calculado mediante un script Node (`bbox.mjs`, parseo de comandos M/C/L/Z relativos) para recortar el `viewBox` con precisión; `docs/ADR/ADR-015_mobile_app_screens.md` (target de despliegue Android/iOS/Web, ya condicionaba que cualquier pieza visual funcione en los tres).

**Decisión tomada**: `react-native-svg` para el trazado (paths copiados tal cual del SVG del usuario en `anatomyPaths.ts`, sin reinterpretarlos) + gradientes; `react-native-reanimated` para las animaciones (`useSharedValue`/`useAnimatedStyle`/`useAnimatedProps`/`interpolate`, sustituyendo los `@keyframes` de CSS -- cada keyframe multi-parada se modela como un valor `progress` animado e `interpolate`, no un salto discreto entre etapas); `expo-blur` para el blur del status pill. Tres adaptaciones donde RN no tiene equivalente CSS directo, documentadas en `src/components/README.md`: `filter:blur()` de las zonas → `RadialGradient` de SVG, `backdrop-filter:blur()` → `expo-blur` con fallback web, parpadeo de cursor `step-end` → fundido rápido.

**Problema real encontrado y corregido de paso**: `react-native-web`/`react-dom` no estaban instalados -- `npx expo export --platform web` fallaba de inmediato con "missing web dependencies". No era solo un bloqueo de esta tarea: sin ellos, el target Web que ADR-015 fija como parte del despliegue (Android+iOS+Web) no funcionaba en absoluto. Instalados vía `npx expo install`.

**Output generado**: `apps/mobile-app/src/components/NeuralLoader/` (10 ficheros: `anatomyPaths.ts`, `constants.ts`, `HeadAnatomy.tsx`, `ActivityZone.tsx`, `EmergingSymbol.tsx`, `ScanRing.tsx`, `BackgroundGrid.tsx`, `Particle.tsx`, `ParticleField.tsx`, `StatusPill.tsx`, `NeuralLoader.tsx`, `index.ts`), `src/components/index.ts` (barrel nuevo), `babel.config.js` actualizado (`react-native-reanimated/plugin`). Sin test automático -- UI puramente visual/de animación, mismo criterio que `SecureStoreTokenStorage`/`WebTokenStorage`. Verificado con `tsc --noEmit`/`eslint` en verde y un bundle real de web (`npx expo export --platform web`, montado temporalmente en `app/index.tsx` y revertido) sin errores de import/runtime -- 1147 módulos. `npx turbo run typecheck lint test` → 31/31 en verde. iOS/Android sin verificar (sin simulador disponible), gap aceptado explícitamente.

---

---
task_id: STATUS-038
date: 2026-08-09
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — invalidateStatisticsOnSessionStart (TDD Green) + wiring en useStartSession

**Input**: Red confirmado de `useSession.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `useSession.ts` (fase anterior, `useStartSession`/`useEndSession` ya existentes), `useQueryClient()` de `@tanstack/react-query` (hook que expone la instancia real del `QueryClient` del árbol de componentes).

**Decisión tomada**: `invalidateStatisticsOnSessionStart(queryClient)` como función exportada aparte de `useStartSession` — recibe el `QueryClient` en vez de leerlo de un hook, precisamente para poder testearla sin `QueryClientProvider`. `useStartSession` la invoca en `onSuccess`, pasándole el resultado de `useQueryClient()`. Sin comparar `mode`/`academicLevel` contra el valor anterior — invalidación incondicional en cada inicio de sesión, judgment call documentado (más simple y más seguro que llevar el rastro de si realmente cambió).

**Output generado**: `apps/mobile-app/src/api/hooks/useSession.ts` actualizado. README de `src/api` actualizado. 1/1 test verde (el ya confirmado en Red), `npx turbo run typecheck lint test` → 31/31 en verde (17/17 tests en `mobile-app`, antes 16).

---

---
task_id: STATUS-037
date: 2026-08-09
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — src/api completo: requests + hooks de TanStack Query (TDD Green + wiring)

**Input**: Red confirmado de los 7 tests de `requests/*.test.ts` (Test Agent, fase previa, misma sesión).

**Contexto utilizado**: `fetchClient.ts` (ya implementado, reutilizado tal cual por todas las funciones de request), `useSessionStore.ts`/`createTokenStorage.ts` (para el `onSuccess` de login/registro), `@tanstack/react-query@^5.56.0` (API `useMutation`/`useQuery` de v5, ya en `package.json`).

**Decisión tomada**: `requests/{auth,session,answer,hint,statistics}.ts` — funciones puras `*Request(dto)`, una por ruta, todas delegando en `fetchClient`. `hooks/{useAuth,useSession,useAnswer,useHint,useStatistics}.ts` — un hook por función de `requests/`, wiring sin test (mismo criterio que `routes.ts`/`main.ts`). `useRegister`/`useLogin` llaman a `useSessionStore.getState().login(...)` en `onSuccess`, combinando `response.userId`/`response.sessionToken` con `variables.email` (la petición que el usuario acaba de enviar) — el backend no devuelve el email. `useUserStatistics` expone una `queryKey` compartida (`queryKeys.ts`) para que el header global y `(app)/statistics` (ambos previstos en ADR-015, todavía sin construir) reutilicen la misma caché. `/health` deliberadamente sin hook — ninguna pantalla lo consume.

**Output generado**: 5 ficheros en `src/api/requests/`, 5 en `src/api/hooks/`, `src/api/queryKeys.ts`, `src/api/index.ts` (barrel). README de `src/api` actualizado. 7/7 tests verdes (los ya confirmados en Red), `npx turbo run typecheck lint test` → 31/31 en verde en todo el monorepo (16/16 tests en `mobile-app`, antes 9). Pendiente: componer estos hooks dentro de pantallas reales (`src/screens`) y `app/`, todavía scaffolding.

---

---
task_id: STATUS-036
date: 2026-08-09
agentes: [developer]
flujo: [developer]
estado: done
---

## 2026-08-09 — Implementaciones reales de TokenStorage

**Input**: "implementa TokenStorage" — el usuario pidió cerrar el hueco que la entrada anterior dejaba explícito (puerto + fake de test, sin implementaciones reales).

**Contexto utilizado**: [ADR-015](../../docs/ADR/ADR-015_mobile_app_screens.md) (decisión: `expo-secure-store` en nativo, `localStorage` en web, seleccionado por `Platform.OS`), `TokenStorage.ts` (puerto ya definido, fase anterior), criterio ya establecido en la sesión para adaptadores que tocan un recurso real no disponible bajo el test runner (`LangChainChatModel`, `XenovaEmbedder`).

**Decisión tomada**: sin tests nuevos — ninguna de las tres piezas es testeable bajo Vitest/node (módulo nativo de Expo, `window`/DOM, resolución de `react-native` vía Metro). `SecureStoreTokenStorage` envuelve `getItemAsync`/`setItemAsync`/`deleteItemAsync`. `WebTokenStorage` envuelve `window.localStorage`. `createTokenStorage()` es la única pieza de wiring — mismo tratamiento que `main.ts` (sin test, wiring puro).

**Output generado**: `expo-secure-store` instalado (`npm install --workspace=apps/mobile-app`, resuelto a `^57.0.1`). `SecureStoreTokenStorage.ts`, `WebTokenStorage.ts`, `createTokenStorage.ts`. README de `src/store` actualizado. `npx turbo run typecheck lint test` → 31/31 en verde (9/9 tests existentes sin cambios, nada nuevo que testear).

---

---
task_id: STATUS-035
date: 2026-08-09
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-09 — Implementación de useSessionStore + fetchClient (TDD Green)

**Input**: Red confirmado de `useSessionStore.test.ts`/`fetchClient.test.ts` (Test Agent, fase previa, misma sesión). Primera implementación real de `mobile-app` del proyecto — hasta ahora solo scaffolding/documentación.

**Contexto utilizado**: [ADR-015](../../docs/ADR/ADR-015_mobile_app_screens.md) (diseño de `TokenStorage`/`useSessionStore`/`fetchClient`), `zustand@^4.5.0` (API `create()`), `expo/tsconfig.base` (`moduleResolution: "bundler"` — confirmado que, a diferencia de `backend-api`/`ai-engine`, no hace falta extensión `.js` en imports relativos).

**Decisión tomada**: `TokenStorage.ts` (interfaz, puerto local de `mobile-app` — no vive en `shared-domain`, es un concepto propio del cliente, no del dominio). `useSessionStore.ts` (Zustand): `hydrate`/`login`/`logout` reciben el `TokenStorage` inyectado en vez de importar una implementación concreta, para poder testear con el fake sin depender de un módulo nativo. Persiste `{userId, email, sessionToken}` como un único blob JSON (no solo el token) — necesario porque `email` no vuelve a llegar del backend tras el login (hueco real detectado al implementar, ya anticipado como riesgo menor en ADR-015 pero resuelto aquí de forma concreta). `fetchClient.ts`: `EXPO_PUBLIC_API_BASE_URL` (único prefijo que Expo expone al bundle de cliente) con fallback a `localhost:3000`, cabecera `Authorization` condicionada a que la ruta no esté en `PUBLIC_PATHS`, error lanzado con `body.error` (forma real confirmada en `errorMapping.ts`, no `body.message`).

**Problema real encontrado y corregido de paso**: `tsc --noEmit` fallaba en el test de `fetchClient` — TypeScript infería `fetchMock.mock.calls[0]` como tupla `[]` al no poder inferir la firma de un `vi.fn(async () => ...)` sin parámetros declarados. Corregido tipando explícitamente los parámetros del mock (`_input: RequestInfo | URL, _init?: RequestInit`).

**Output generado**: `apps/mobile-app/src/store/TokenStorage.ts`, `apps/mobile-app/src/store/useSessionStore.ts`, `apps/mobile-app/src/api/fetchClient.ts`, `apps/mobile-app/.env.example` (nuevo, `EXPO_PUBLIC_API_BASE_URL`). READMEs de `src/store`/`src/api` actualizados de "Pendiente de implementar" al estado real. 9/9 tests verdes (`vitest run`), `npx turbo run typecheck lint test` → **31/31 en verde** en todo el monorepo (primera vez que `mobile-app` aporta tests reales al pipeline, antes solo `--passWithNoTests`). Implementaciones concretas de `TokenStorage` (`expo-secure-store`/`localStorage`) y los hooks de TanStack Query de `src/api` quedan pendientes — siguiente paso lógico.

---

---
task_id: STATUS-016
date: 2026-08-06
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Implementación de computeNextDifficulty (TDD Green)

**Input**: Confirmación del usuario para implementar `computeNextDifficulty` tras el Red de 8/8 tests fallidos (Test Agent, fase previa). Primera activación del Developer Agent en el proyecto.

**Contexto utilizado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts` (8 tests con valores calculados a mano, la especificación real a satisfacer), docs/ADR/ADR-005-adaptive-difficulty-engine.md (fórmulas 1-5), restricción de la skill ("Debe respetar Clean Architecture, Contratos existentes, Casos de uso definidos" — función pura sin I/O ni dependencias de framework).

**Decisión tomada**: Implementación directa de las 5 fórmulas de ADR-005 (`computeExpectedScore`, `computeActualScore` con clamp, `computeK` con tope de racha, actualización simétrica de `userRating`/`exerciseRating`), reemplazando el `declare function` de la fase Red. `K_base` fijo en 32 (K provisional/cold start sigue diferido, ver nota en ADR-005).

**Problema real encontrado y corregido de paso**: al ejecutar `turbo run test` por primera vez en todo el monorepo (no solo el paquete tocado), los paquetes sin tests todavía fallaban con `No test files found, exiting with code 1` — habría roto el pipeline de test para cualquiera que lo ejecutara en la raíz. Corregido añadiendo `--passWithNoTests` (flag real de vitest, verificado con `--help`) a los 8 `package.json` con script `test`.

**Output generado**: `packages/shared-domain/src/services/AdaptiveDifficultyEngine.ts` (implementación completa). Verificado: `vitest run` → **8/8 tests en verde** (primer intento, sin necesitar ajustes — los cálculos a mano de la fase Red coincidieron). `npx turbo run typecheck lint test`: todo en verde en los 12-22 paquetes según la tarea.

---

---
task_id: STATUS-020
date: 2026-08-06
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Implementación de UpdateDifficultyUseCase y ValidateAnswerUseCase (TDD Green)

**Input**: Confirmación del usuario ("si") para implementar tras el Red de 8/8 tests fallidos (Test Agent, fase previa). Primer Caso de Uso de Application completo del proyecto.

**Contexto utilizado**: `UpdateDifficultyUseCase.test.ts` y `ValidateAnswerUseCase.test.ts` (especificación real a satisfacer), `computeNextDifficulty` (ya implementado, no se repite la fórmula), contratos de `packages/shared-domain/src/repositories` y `src/ports`.

**Decisión tomada**: `UpdateDifficultyUseCase` depende solo de `ExerciseRepository` (recibe `userRating` como parámetro en vez de recargar el `User`, evitando doble fetch/escritura con `ValidateAnswerUseCase`) — persiste el lado `Exercise` y devuelve `nextUserRating` a quien la invoque. `ValidateAnswerUseCase` orquesta `Session`→`Exercise`→`User`, deriva el timeout (flujo 1a) de `responseTimeMs >= exercise.timer.limitMs` sin campo de input nuevo, y hace una única escritura de `User` (streak + rating) tras recibir `nextUserRating` de `UpdateDifficultyUseCase`.

**Output generado**: `apps/backend-api/src/application/use-cases/{UpdateDifficultyUseCase,ValidateAnswerUseCase}.ts` (implementación completa, reemplaza el `declare class` de la fase Red). Verificado: `vitest run` → **8/8 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo.

---

---
task_id: STATUS-021
date: 2026-08-06
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Implementación de GetUserStatisticsUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 3/3 tests fallidos (Test Agent, fase previa) — el usuario ya había delegado el ciclo completo ("vamos con lo que indicas").

**Contexto utilizado**: `GetUserStatisticsUseCase.test.ts` (especificación real a satisfacer, incluye el caso límite del umbral `MIN_ATTEMPTS_PER_TOPIC`), contratos `UserRepository`/`AnswerRepository`/`ExerciseRepository` ya existentes.

**Decisión tomada**: agregación en un `Map<TemaCode, TopicAccumulator>` en una sola pasada sobre las `Answer` del usuario (con cache de `Exercise` por id para no repetir `findById`), fortalezas/debilidades como los `topics` que superan `MIN_ATTEMPTS_PER_TOPIC` ordenados por `accuracy` (desc/asc) y recortados a `TOP_N`. Usuario inexistente lanza error (mismo criterio que `ValidateAnswerUseCase`).

**Output generado**: `apps/backend-api/src/application/use-cases/GetUserStatisticsUseCase.ts` (implementación completa). Verificado: `vitest run` → **3/3 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo.

---

---
task_id: STATUS-022
date: 2026-08-06
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Implementación de EndSessionUseCase y GenerateHintUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 10/10 tests fallidos (Test Agent, fase previa) — mismo patrón de delegación que las iteraciones anteriores.

**Contexto utilizado**: `EndSessionUseCase.test.ts` y `GenerateHintUseCase.test.ts` (especificación real a satisfacer), puertos `Clock`/`HintUsageTracker`/`IdGenerator` y `Session.ratingAtStart` ya materializados.

**Decisión tomada**: `EndSessionUseCase` calcula el resumen directamente sobre las `Answer` de la sesión (sin más dependencias que `AnswerRepository`), compara el rating actual del usuario contra `session.ratingAtStart` para la variación, y hace un único `save` de la `Session` con `endedAt`. `GenerateHintUseCase` valida sesión activa → ejercicio existente → `type === 'Resolution'` → tiempo expirado, en ese orden; usa `HintUsageTracker.incrementAndGet` para obtener `order` antes de decidir si reutiliza (`HintRepository.findByExerciseIdAndOrder`) o genera (`HintGenerator.generate` + `save`).

**Output generado**: `apps/backend-api/src/application/use-cases/{EndSessionUseCase,GenerateHintUseCase}.ts` (implementación completa). Verificado: `vitest run` → **10/10 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo, 21/21 tests en `backend-api` (5 Casos de Uso ya implementados).

---

---
task_id: STATUS-023
date: 2026-08-06
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Implementación de SelectNextExerciseUseCase y StartSessionUseCase (TDD Green)

**Input**: Continuación sin pausa tras el Red de 11/11 tests fallidos (Test Agent, fase previa). Completa el set de 6 Casos de Uso listados en `application/use-cases/README.md`.

**Contexto utilizado**: `SelectNextExerciseUseCase.test.ts` y `StartSessionUseCase.test.ts` (especificación real a satisfacer), `TemaRepository`/`Tema` ya materializados, `ExerciseRepository.findByDifficultyBand` (contrato ya existente, sin cambios).

**Decisión tomada**: `SelectNextExerciseUseCase` consulta banda estrecha (±150) y solo si viene vacía consulta banda ampliada (±300) — evita una consulta redundante cuando la banda estrecha ya tiene resultados; selecciona con `reduce` el candidato de `difficulty` más próximo al `userRating`. `StartSessionUseCase` valida Tema→AcademicLevel antes de tocar cualquier repositorio de escritura (falla rápido), y compone `SelectNextExerciseUseCase` real para el paso 3 en vez de duplicar su lógica.

**Output generado**: `apps/backend-api/src/application/use-cases/{SelectNextExerciseUseCase,StartSessionUseCase}.ts` (implementación completa). Verificado: `vitest run` → **11/11 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 30/30 tareas en verde en todo el monorepo, **32/32 tests en `backend-api`** — los 6 Casos de Uso de `application/use-cases/README.md` quedan completos.

---

---
task_id: STATUS-024
date: 2026-08-06
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-06 — Implementación de QwenClient, LangChainQwenModel y QwenHintGenerator (TDD Green)

**Input**: Continuación sin pausa tras el Red de 7/7 tests fallidos (Test Agent, fase previa). Primera pieza de Infrastructure con implementación real (no `declare class`) del proyecto.

**Contexto utilizado**: `QwenClient.test.ts`/`QwenHintGenerator.test.ts` (especificación real a satisfacer), `buildGenerateExercisePrompt`/`buildGenerateHintPrompt` + schemas Zod ya creados, `@langchain/openai` instalado (resuelto `1.5.6`, forzó `@langchain/core` de `1.2.4` a `1.2.5` para satisfacer su peer — sin conflicto ERESOLVE).

**Decisión tomada**: `QwenClient.generateExercise`/`generateHint` arman el prompt, invocan `ChatModel.invoke`, y parsean+validan con `schema.parse(JSON.parse(raw))` — cualquier fallo (JSON invalido o forma incorrecta) se propaga como excepción sin capturarla (control de seguridad ante output de IA, ADR-012). `LangChainQwenModel` implementa `ChatModel` envolviendo `ChatOpenAI` de LangChain contra el endpoint OpenAI-compatible de Qwen — **sin tests automáticos**, gap aceptado explícitamente (depende de red real). `QwenHintGenerator` mapea `{exercise, order, previousHints}` a `GenerateHintInput` y delega en `QwenClient.generateHint`, tipado contra `Pick<QwenClient, 'generateHint'>` para permitir fakes estructurales en tests. `apps/ai-engine/src/index.ts` deja de ser un placeholder — exporta `ChatModel`/`QwenClient`/`LangChainQwenModel` para que `backend-api` los consuma como paquete de workspace (`main`/`types` añadidos al `package.json`, antes ausentes).

**Output generado**: `apps/ai-engine/src/llm/{QwenClient,LangChainQwenModel}.ts`, `apps/ai-engine/src/index.ts`, `apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts` (implementación completa). Verificado: `vitest run` → **7/7 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 31/31 tareas en verde en todo el monorepo, 5/5 tests en `ai-engine`, 35/35 tests en `backend-api`.

---

---
task_id: STATUS-026
date: 2026-08-06
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-06 — Implementación de GenerateExerciseBatchUseCase (UC-001, TDD Green)

**Input**: Continuación sin pausa tras el Red de 5/5 tests fallidos (Test Agent, fase previa). Último Caso de Uso pendiente — cierra UC-001 a UC-008 completos.

**Contexto utilizado**: `GenerateExerciseBatchUseCase.test.ts` (especificación real a satisfacer), `Tema.academicLevels`/`difficultyRange` (ADR-006), invariante de `Exercise` (ADR-004).

**Decisión tomada**: `MAX_ATTEMPTS=3` (el UC no fija N, judgment call documentado igual que `MIN_ATTEMPTS_PER_TOPIC` en UC-007) y `DEFAULT_TIME_LIMIT_MS=15000` (ningún ADR/UC fija el límite de tiempo de un ejercicio generado por IA — deliberadamente no lo decide Qwen, ver "Estrategia IA" de `ARCHITECTURE.md`, es una regla determinística). `violatesExerciseInvariant` como función pura local (no exportada durante el Red, añadida solo en Green — coherente con la disciplina TDD del resto del proyecto). `difficulty` inicial = punto medio del `difficultyRange` del Tema para el `AcademicLevel` pedido. Bucle de reintento simple (`for` con `continue`), sin backoff ni cola de revisión manual (fuera de alcance, documentado).

**Output generado**: `apps/ai-engine/src/batch/GenerateExerciseBatchUseCase.ts` (implementación completa), `apps/ai-engine/src/batch/README.md` (corregido — referenciaba UC-003 incorrectamente). Verificado: `vitest run` → **5/5 tests en verde** (primer intento). `npx turbo run typecheck lint test`: 31/31 tareas en verde en todo el monorepo, 10/10 tests en `ai-engine`.

---

---
task_id: STATUS-027
date: 2026-08-07
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
---

## 2026-08-07 — Backend real completo: RegisterUseCase/LoginUseCase, 5 Controllers, auth, Express, verificación manual end-to-end

**Input**: continuación sin pausa a través de todos los Red de la sesión "comenzamos con el backend" — el usuario delegó el ciclo completo, mismo patrón que iteraciones anteriores.

**Contexto utilizado**: todos los `.test.ts` escritos en esta sesión (Test Agent), puertos/entidades nuevos ya materializados (`PasswordHasher`, `TokenIssuer`, `UserCredentials`, `Session.topic`, `HintUsageTracker.get`, `SEED_RATING_BY_LEVEL`).

**Decisión tomada**: `RegisterUseCase`/`LoginUseCase` implementados siguiendo UC-009/UC-010 al pie de la letra. Los 5 Controllers son traducción pura DTO↔UseCase, sin lógica de negocio (regla 8 de `ARCHITECTURE.md`) — la única lógica no trivial es `AnswerController.tryComposeNextExercise` (try/catch alrededor de `SelectNextExerciseUseCase`, omite `nextExercise` en vez de fallar toda la petición si el pool está agotado). `BcryptPasswordHasher`/`JwtTokenIssuer` usan las librerías reales (`bcrypt`, `jsonwebtoken`) sin abstracción adicional — a diferencia de `LangChainQwenModel`, sí tienen tests reales porque no dependen de red. `authMiddleware` resuelve `Authorization: Bearer` a `req.userId`, nunca confía en el body. `routes.ts`/`main.ts` son wiring puro (Express Router + composición de dependencias) — sin tests automáticos (necesitarían `supertest`, no incorporado en este alcance), verificados en su lugar **arrancando el servidor de verdad** (`npx tsx src/presentation/main.ts` con `JWT_SECRET` de prueba) y probando con `curl` el flujo completo: registro → login → iniciar sesión → responder (rating cambió de 800 a 805.36, fórmula de ADR-005 aplicada de verdad) → finalizar sesión → estadísticas → 401 sin token. `main.ts` usa repositorios en memoria (`@mathmind/shared-testing`) porque `Prisma*Repository` sigue en esqueleto — documentado explícitamente en el propio archivo como limitación temporal, no como diseño final.

**Output generado**: `apps/backend-api/src/application/use-cases/{RegisterUseCase,LoginUseCase}.ts`, `apps/backend-api/src/presentation/http/{Auth,Session,Answer,Hint,Statistics}Controller.ts`, `apps/backend-api/src/infrastructure/auth/{BcryptPasswordHasher,JwtTokenIssuer}.ts`, `apps/backend-api/src/presentation/http/middleware/authMiddleware.ts`, `apps/backend-api/src/presentation/http/routes.ts`, `apps/backend-api/src/presentation/main.ts` (reescrito, antes solo `/health`). Dependencias nuevas: `bcrypt`, `jsonwebtoken` (+ `@types/*`). Verificado: `npx turbo run typecheck lint test` → **31/31 tareas en verde**, 83 tests (73 `backend-api` + 10 `ai-engine`). Smoke test manual end-to-end exitoso.

---

---
task_id: STATUS-028
date: 2026-08-07
agentes: [developer]
flujo: [developer, reviewer, security, documentation]
estado: done
---

## 2026-08-07 — Corrección de los 3 hallazgos de Security (fuga de mensajes, política de contraseña, algoritmo JWT)

**Input**: el usuario señaló que Reviewer y Security nunca se habían ejecutado como fases del flujo. Pasadas retroactivas de ambos (ver `.ai/prompts/{reviewer,security}.md`) confirmaron 3 hallazgos de Security sobre el código de autenticación; corregidos aquí con TDD.

**Contexto utilizado**: `.ai/prompts/security.md` (los 3 hallazgos confirmados), código existente de `routes.ts`, `RegisterUseCase.ts`, `JwtTokenIssuer.ts`.

**Decisión tomada**: (1) nuevo `errorMapping.ts` — función pura `mapUseCaseError(error, exposeMessage)`, testeada de verdad (a diferencia de `routes.ts`, que sigue siendo wiring sin tests): `exposeMessage=false` colapsa cualquier error a un mensaje genérico + 403, usado en `/sessions/end`, `/answers`, `/hints` (las tres rutas cuyos Casos de Uso verifican propiedad de una `Session`); `exposeMessage=true` mantiene el comportamiento anterior donde el mensaje es contenido de producto pretendido (registro, login, iniciar sesión, estadísticas). (2) `RegisterUseCase`: `MIN_PASSWORD_LENGTH=8` (OWASP ASVS L1), verificado antes de tocar cualquier repositorio — tests existentes con contraseñas de 1 carácter actualizados a 8+. (3) `JwtTokenIssuer.verify`: `algorithms: ['HS256']` explícito — confirmado con un test que jsonwebtoken ya rechazaba `alg=none` incluso sin el fix (defensa en profundidad, no corrección de una vulnerabilidad explotable hoy).

---

---
task_id: STATUS-031
date: 2026-08-07
agentes: [developer]
flujo: [architecture, test, developer]
estado: done
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

---
task_id: STATUS-033
date: 2026-08-08
agentes: [developer]
flujo: [test, developer]
estado: done
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

---
task_id: STATUS-033
date: 2026-08-08
agentes: [developer]
flujo: [test, developer]
estado: done
---

## 2026-08-08 — Cierre de UC-011: pgvector instalado, RAG verificado end-to-end con datos reales

**Input**: el usuario instaló pgvector y pidió continuar en el mismo mensaje que el commit de la implementación anterior.

**Contexto utilizado**: `STATUS.md` #33 (los 2 tests bloqueados, el no-op de `main.ts`), `apps/backend-api/src/infrastructure/rag/PostgresKnowledgeBaseIndex.integration.test.ts`.

**Decisión tomada**: `prisma db push` en verde tras confirmar `pg_available_extensions` (consulta de solo lectura) → `vector` instalada. Al ejecutar los tests antes bloqueados surgieron dos problemas reales, no del bloqueo: (1) `FakeEmbedder` generaba 8 dimensiones contra una columna `vector(384)` — pgvector lo rechazó con un error claro (`expected 384 dimensions, not 8`), corregido subiendo `FakeEmbedder` a 384 dimensiones (coherente con `XenovaEmbedder` real). (2) El test de similitud asumía que un fake sin semántica real podía demostrar que "fracciones" recupera antes que "Paris" — no hay garantía de eso con un hash determinista sin significado. Rediseñado para buscar con el mismo texto exacto que generó el embedding del chunk relevante (mismo embedder, mismo input, distancia garantizada 0), probando así la mecánica de orden SQL real sin depender de que el fake tenga semántica (esa garantía la da `XenovaEmbedder`, verificado aparte, manualmente). `main.ts`: sustituido el no-op inline por `new PostgresKnowledgeBaseIndex(prisma, new XenovaEmbedder())`.

**Verificación manual end-to-end** (no solo tests): fichero `.txt` real sobre fracciones equivalentes depositado en un directorio de prueba, `npm run ingest:rag` — descargó el modelo `Xenova/all-MiniLM-L6-v2` de HuggingFace Hub la primera vez, generó su embedding real, lo guardó en `rag_chunks`, registró `rag_ingestion_records` (`Processed`, 1 chunk), movió el fichero al histórico. `PostgresKnowledgeBaseIndex.search()` con una query relacionada semánticamente ("cómo se calculan fracciones equivalentes") recuperó el chunk correcto usando el modelo real, sin ningún fake en la cadena — primera prueba real de retrieval semántico de todo el proyecto. Datos de la prueba limpiados después.

**Output generado**: `packages/shared-testing/src/mocks/FakeEmbedder.ts` (384 dimensiones), `apps/backend-api/src/infrastructure/rag/PostgresKnowledgeBaseIndex.integration.test.ts` (test de similitud rediseñado), `apps/backend-api/src/presentation/main.ts` (adaptador real conectado). Verificado: `npx turbo run typecheck lint test` → **31/31 en verde**. `npm run test:integration` → **31/31 en verde** (0 bloqueados, todo el backend con cobertura real de punta a punta).