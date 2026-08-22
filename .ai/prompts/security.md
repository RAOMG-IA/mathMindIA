# Security Agent
Review OWASP Top 10 risks, secrets, dependencies and validation.

---

---
task_id: STATUS-064
date: 2026-08-21
agentes: [security]
flujo: [director, product, architecture, test, developer, reviewer, security, documentation]
artefactos: [apps/mobile-app/src/store/useInactivityLogout.ts, apps/mobile-app/src/components/AppHeader/AppHeader.tsx, docs/ADR/ADR-015_mobile_app_screens.md]
estado: done
---

## 2026-08-21 — US-010 "Cerrar sesión" (logout manual + inactividad)

**Input**: el usuario (Project Director) pidió pasar Reviewer y Security sobre US-010, sin objeciones del primero (`.ai/prompts/reviewer.md`, misma fecha).

**Contexto utilizado**: `.ai/skills/security.md`, `docs/user-stories/US-010-cerrar-sesion.md` ("Fuera de alcance": revocación de token en servidor, explícitamente no pedida), adenda ADR-015 (ya señala los mismos dos huecos que confirma esta pasada).

**Hallazgos**:
1. **No bloqueante, ya señalado por Architecture, confirmado aquí — cerrar sesión (manual o por inactividad) no revoca nada en el servidor**: el JWT robado (p. ej. vía XSS sobre `localStorage` en Web, riesgo ya aceptado en ADR-015) sigue siendo válido hasta su expiración natural de 7 días (`JwtTokenIssuer`) aunque el usuario legítimo "cierre sesión" en su propio dispositivo — la función protege la sesión visible en el cliente, no revoca una credencial ya comprometida. Coherente con lo que la propia US-010 dejó fuera de alcance; no es una regresión introducida por esta historia, es el mismo modelo de amenaza que ya tenía el sistema (sin revocación de sesión en ningún punto del proyecto hasta ahora).
2. **No bloqueante — el temporizador de inactividad es una función de producto, no un control de seguridad**: se basa en `Date.now()` del propio dispositivo del usuario y en eventos de interacción del lado cliente, ambos manipulables por quien tenga control del dispositivo (mismo motivo por el que US-009 ya documentó que la contraseña derivada de IP "no es un mecanismo de seguridad real"). No se corrige — no pretende serlo, es UX de sesión, no autenticación.
3. **Sin hallazgos** en gestión de secretos (ningún secreto nuevo, sin tocar `.env`/JWT/bcrypt), validación de inputs (ningún endpoint ni formulario nuevo — solo interacción de UI local), ni cumplimiento de ADR-012 (no toca política de contraseñas, CORS ni línea base de seguridad existente).

**Decisión tomada**: sin objeciones bloqueantes. Ambos hallazgos quedan documentados como riesgo aceptado, ya anticipado por Architecture — pasa a Documentation.

**Output generado**: esta entrada.

---

## 2026-08-12 — Cierre de hallazgo: puntos 3/4/5 de la revisión de skills (2026-08-06)

**Input**: el usuario pidió revisar el estado de "solape de Salidas entre architecture.md/documentation.md" y "ejemplos desincronizados en knowledge-manager.md", listados como pendientes desde la revisión de `.ai/skills/*.md` del 2026-08-06 (STATUS-017: "Puntos 3, 4 y 5 quedan pendientes de confirmación del usuario, no resueltos todavía").

**Verificación (antes de tocar nada)**:
- **Punto 4 (solape ADRs/ARCHITECTURE.md)**: ya resuelto en el contenido — `architecture.md` línea 14 y `documentation.md` líneas 13/53 disambiguan con claridad quién redacta qué, sin contradicción. Se corrigió en algún momento posterior a 2026-08-06 sin cerrar formalmente este hallazgo.
- **Punto 5 (ejemplos desincronizados en `knowledge-manager.md`)**: ya resuelto — `grep` de "ADR-003", "Difficulty Calculator" y `.spec.ts` no devuelve resultados; los ejemplos actuales citan `AdaptiveDifficultyEngine`/`computeNextDifficulty`/ADR-005/ADR-006/ADR-013 (reales), y la línea 271 aclara explícitamente la convención `.test.ts` real.
- **Punto 3 (`reviewer.md` asume flujo de Pull Request pese a que el repo no estaba inicializado como git)**: **no verificado en esta tarea** — el usuario no lo mencionó, fuera del alcance pedido. Sigue listado como "Pull Request" en `reviewer.md` (Entradas); el repo ya es un git real con commits activos, pero no se ha confirmado si el resto del contenido de `reviewer.md` sigue siendo coherente con eso. Queda como hallazgo abierto, no cerrado aquí.

**Hallazgo nuevo, no registrado en 2026-08-06**: ambas skills seguían listando "Diagramas" sin cualificar en `Responsabilidades`/`Salidas` — sin contradicción práctica (Mermaid de ADRs vive en Architecture, diagramas de README en Documentation, confirmado con `grep`), pero sí ambigüedad en la definición escrita.

**Decisión tomada**: cualificado el bullet "Diagramas" en ambas skills (`architecture.md`: "Diagramas técnicos/de dominio... dentro de ADRs y ARCHITECTURE.md"; `documentation.md`: "Diagramas de README.md... distinto de los diagramas técnicos/de dominio en ADRs/ARCHITECTURE.md"), en Responsabilidades y Salidas de ambas. Puntos 4 y 5 del hallazgo original se dan por cerrados. Punto 3 permanece abierto.

**Output generado**: `.ai/skills/architecture.md`, `.ai/skills/documentation.md`. Esta entrada.

---

## 2026-08-11 — Revisión: UC-008 flujo 2b (reposición bajo demanda) + filtro `type`/exclusión

**Contexto utilizado**: `AnswerController.ts` (`tryReplenishPool`), `SelectNextExerciseUseCase.ts`, `main.ts` (wiring de `GenerateExerciseBatchUseCase`), ADR-012.

**Hallazgos**:
1. **IA invocada por primera vez desde un camino de request de usuario real**: hasta ahora, UC-001 (generación) solo corría desde un script CLI manual, nunca desde `POST /answers`. `tryReplenishPool` solo se dispara cuando `SelectNextExerciseUseCase` falla incluso en banda ampliada y excluyendo ya respondidos — no en el camino feliz, pero es una superficie nueva: cada llamada real al LLM tiene coste (cuota del proveedor) y latencia (varios segundos).
2. **Vector de coste/latencia, no de autorización**: un usuario en un Tema/nivel/`type` con pool muy escaso (o agotable respondiendo rápido) puede disparar `tryReplenishPool` repetidamente, una llamada real al LLM por cada `POST /answers` mientras el pool no se repone lo bastante rápido. No hay límite de frecuencia por usuario/sesión sobre esta ruta. Riesgo de coste (cuota del proveedor de IA) más que de seguridad clásica — señalado, no bloqueante para esta tarea; un rate-limit por sesión/usuario sobre `tryReplenishPool` sería la mitigación natural si el coste real lo justifica.
3. **Contenido generado sigue validado igual que siempre**: `tryReplenishPool` reutiliza `GenerateExerciseBatchUseCase` tal cual (invariantes de `Exercise` vía `violatesExerciseInvariant`, sin cambios) — ningún contenido nuevo se persiste sin pasar por esa validación.
4. **Sin superficie IDOR nueva**: `session.topic`/`session.academicLevel`/`session.mode` ya se leían de la `Session` (no del request) antes de este cambio; `excludeExerciseIds` sale de `AnswerRepository.findBySessionId(sessionId)`, la misma `Session` ya autorizada contra `userId` más arriba en `submitAnswer`.
5. **Filtro por `type` es una corrección de seguridad de datos, no solo funcional**: antes, un usuario en Modo Resolución podía recibir un ejercicio `Test` como "siguiente" (con `options` que el cliente ignoraba) — no explotable (no expone `correctAnswer` ni nada sensible), pero sí una violación de la invariante de dominio documentada en `Session.ts`. Corregido.

**Decisión tomada**: sin cambios de código adicionales — el hallazgo #2 (ausencia de rate-limit) se deja señalado, mismo criterio que otros trade-offs ya aceptados (p. ej. mensajes de error genéricos de IDOR, 2026-08-07). No bloqueante.

**Output generado**: esta entrada.

---

## 2026-08-11 — Revisión: `SessionSummaryScreen`

**Contexto utilizado**: `apps/mobile-app/src/screens/SessionSummaryScreen.tsx`, `EndSessionUseCase.ts` (autorización ya cubierta en una revisión anterior), `queryKeys.ts`.

**Hallazgos**:
1. **Sin superficie HTTP nueva**: la pantalla no llama a ningún endpoint — lee un `EndSessionResponseDto` ya recibido y validado por `POST /sessions/end` (autorizado contra `session.userId`, revisión previa), sembrado en caché de cliente por `SessionScreen`. No hay forma de que un usuario vea el resumen de una sesión ajena: la clave de caché (`sessionSummary(sessionId)`) solo se puebla localmente tras una respuesta 200 legítima de su propia sesión.
2. **Caché sin expiración explícita**: el resumen queda en la caché de TanStack Query indefinidamente (sin `gcTime` acotado) hasta que la pestaña se cierra o recarga. No es sensible más allá de lo que ya era visible al usuario en pantalla (aciertos/tiempos/rating de su propia sesión) — sin severidad, no bloqueante.
3. **Sin secretos ni dependencias nuevas.**

**Decisión tomada**: sin cambios de código. Ningún hallazgo crítico ni bloqueante.

**Output generado**: esta entrada.

---

## 2026-08-11 — Fix: sesión de cliente no se invalidaba ante un 401

**Contexto utilizado**: `apps/mobile-app/src/api/fetchClient.ts`, `useSessionStore.ts`, `(app)/_layout.tsx`, hueco ya señalado en la revisión de `session/[sessionId].tsx` (2026-08-11, punto 6) y en memoria del proyecto.

**Hallazgos**:
1. **Hueco confirmado con un caso real, ahora corregido**: un `sessionToken` inválido/expirado (aquí, por rotación de `JWT_SECRET`) seguía tratándose como sesión activa en el cliente — cualquier request autenticada fallaba en silencio (401 → error de React Query, sin acción). No es una vulnerabilidad de autorización (el backend seguía rechazando correctamente el token, `JwtTokenIssuer`/middleware sin tocar) sino un fallo de UX/resiliencia que además puede ocultar un problema real de sesión al usuario.
2. **Alcance del fix, deliberadamente acotado**: `expireSession()` solo limpia el estado en memoria (Zustand), no `TokenStorage` — la entrada persistida (`localStorage`/`SecureStore`) queda obsoleta hasta el siguiente `login()` real (que la sobreescribe). Riesgo residual aceptado: si el usuario cierra la pestaña/app sin volver a loguearse, la próxima carga rehidrata el token muerto y repite el ciclo una vez más (autolimitado — el guard corrige en cuanto la primera request real falla), no un bucle infinito ni un fallo de seguridad.
3. **Ruta pública excluida a propósito**: un 401 en `/auth/login` son credenciales inválidas, no sesión caducada — `expireSession()` no se dispara ahí (test dedicado que lo confirma).
4. **Sin secretos ni dependencias nuevas.**

**Decisión tomada**: sin hallazgos bloqueantes — cambio que reduce superficie de confusión/soporte, no introduce riesgo nuevo.

**Output generado**: esta entrada.

---

## 2026-08-11 — Revisión: script `generate:exercises`

**Contexto utilizado**: `apps/backend-api/src/scripts/generateExerciseBatch.ts`, `.env`/`.env.example`, ADR-012.

**Hallazgos**:
1. **Sin superficie HTTP nueva**: es un script CLI manual (`npm run generate:exercises`), no una ruta expuesta — mismo perfil de riesgo que `ingest:rag`, sin autenticación aplicable (se ejecuta con acceso ya de operador/desarrollador al servidor).
2. **Secretos**: `AI_API_KEY` se lee solo de `process.env` (vía `dotenv/config`), nunca se loguea ni se persiste — mismo criterio que el resto de scripts de composición. La corrección de `AI_BASE_URL` (endpoint mal formado de Gemini) no tocó ningún valor de secreto, solo la URL pública del endpoint.
3. **Sin dependencias nuevas**: reutiliza `LangChainChatModel`/`QwenClient`/`PostgresKnowledgeBaseIndex` ya auditados.
4. **Contenido generado por IA**: `GenerateExerciseBatchUseCase` ya valida el output contra las invariantes de `Exercise` (ADR-004) antes de persistir (`violatesExerciseInvariant`) — sin cambio aquí, el script solo invoca el Caso de Uso existente.

**Decisión tomada**: sin cambios de código. Ningún hallazgo crítico ni bloqueante.

**Output generado**: esta entrada.

---

## 2026-08-11 — Revisión: `app/(app)/session/[sessionId].tsx`

**Contexto utilizado**: `apps/mobile-app/src/screens/SessionScreen.tsx`, `useTrainingSessionStore.ts`, `apps/backend-api/src/presentation/http/routes.ts` (mapeo de errores de `/answers`/`/hints`/`/sessions/end`), ADR-012.

**Hallazgos**:
1. **Sin hallazgos de OWASP Top 10**: `submittedValue` viaja como string en el body JSON de `POST /answers`, comparado server-side sin interpretarse ni ejecutarse — sin superficie de inyección nueva. El botón "Resolver" no añade una ruta nueva ni un campo nuevo: reutiliza `POST /answers` con `submittedValue: ''`, mismo mecanismo ya cubierto por los tests de `ValidateAnswerUseCase`.
2. **Sin fuga de la respuesta correcta antes de responder**: `useTrainingSessionStore.currentExercise` es siempre un `ExercisePublicDto` (nunca incluye `correctAnswer`/`explanation`/`difficulty`, por diseño del propio DTO) — el store de cliente no puede filtrar la solución aunque se inspeccione en DevTools.
3. **Mensajes de error genéricos respetados**: `SessionScreen` muestra un banner genérico ante cualquier error de `submitAnswer`/`requestHint`/`endSession`, sin intentar distinguir causas — consistente con `errorMapping.ts` (`exposeMessage=false` en esas tres rutas, hallazgo Security 2026-08-07, IDOR).
4. **Efecto colateral del enmascarado genérico, no nuevo pero confirmado aquí por primera vez con un caso real**: el mismo mecanismo que evita filtrar causas de IDOR también oculta errores operativos legítimos — verificado en esta tarea que un fallo real de facturación de DeepSeek (`402 Insufficient Balance`) llega al cliente como `"Forbidden or invalid session"`, indistinguible de un intento de acceso a una sesión ajena. No es una vulnerabilidad (no hay downgrade de seguridad, el mensaje sigue sin revelar nada explotable) pero sí un coste real de observabilidad/soporte — ya aceptado como trade-off en el hallazgo original de 2026-08-07, reconfirmado aquí con un caso concreto en vez de teórico.
5. **Sin secretos ni dependencias nuevas**: ningún literal sensible añadido; sin instalaciones nuevas en esta tarea.
6. **Sin regresión de hallazgos previos**: el hueco de sesión no invalidada ante 401 (`fetchClient.ts`, revisión 2026-08-10) sigue igual, no tocado.

**Decisión tomada**: sin cambios de código. Ningún hallazgo crítico ni bloqueante — el hallazgo #4 es un recordatorio, no una acción nueva (ya estaba aceptado).

**Output generado**: esta entrada.

---

---
task_id: STATUS-047
date: 2026-08-10
agentes: [security]
flujo: [architecture, developer, security]
artefactos: [apps/backend-api/src/presentation/http/corsConfig.ts, apps/backend-api/src/presentation/main.ts]
estado: done
---

## 2026-08-10 — Revisión: CORS (`CORS_ALLOWED_ORIGINS`)

**Contexto utilizado**: `apps/backend-api/src/presentation/http/corsConfig.ts`, `main.ts`, `.env.example`, ADR-012 adenda CORS.

**Hallazgos**:
1. **Sin wildcard, rechazo por defecto**: `isOriginAllowed([]) === false` para cualquier origen de navegador — pedido explícito del usuario ("que la privacidad no se vea afectada"), verificado con test (`corsConfig.test.ts`, "rechaza cualquier origin si la lista esta vacia") y manualmente (origen no listado → sin cabecera `Access-Control-Allow-Origin`, el navegador bloquea la respuesta).
2. **`credentials` no habilitado**: el middleware `cors()` se monta sin `credentials: true` — no hay cookies de sesión en este contrato (`Authorization: Bearer <sessionToken>` vía JSON, ADR-015/ARCHITECTURE.md), así que no hace falta, y omitirlo evita abrir esa superficie sin necesidad (si en el futuro se migrara a cookies `httpOnly`, habría que revisar esta config junto con esa decisión, ya señalada como fuera de alcance en ADR-015).
3. **Sin dependencias nuevas de riesgo**: `cors@2.8.6`/`@types/cors@2.8.19` (mismo `cors` que usa la inmensa mayoría del ecosistema Express, sin CVEs abiertos conocidos a esta fecha). `npm audit` tras instalarlo no atribuye ninguna de las vulnerabilidades existentes (protobufjs/sharp/vite, todas de `ai-engine`/tooling de test) a `cors` en sí.
4. **Sin secretos**: `CORS_ALLOWED_ORIGINS` son URLs públicas de despliegue, no credenciales — mismo criterio que `DATABASE_URL`/`AI_BASE_URL` en cuanto a vivir solo en `.env`, pero no requiere el mismo secretismo que `JWT_SECRET`/`AI_API_KEY`.
5. **No introduce ni agrava el hallazgo ya documentado** (revisión 2026-08-10 anterior, guard de `(app)/_layout.tsx`): el manejo de 401/token caducado en `fetchClient.ts` sigue igual, sin relación con CORS.

**Decisión tomada**: sin cambios de código. Ningún hallazgo crítico ni bloqueante.

**Output generado**: esta entrada.

---

---
task_id: STATUS-046
date: 2026-08-10
agentes: [security]
flujo: [architecture, developer, security]
artefactos: [apps/backend-api/src/presentation/http/TemaController.ts, apps/backend-api/src/infrastructure/seed/temaCatalog.ts, apps/mobile-app/src/screens/HomeScreen.tsx]
estado: done
---

## 2026-08-10 — Revisión: `GET /temas` + `(app)/home.tsx`

**Contexto utilizado**: `apps/backend-api/src/presentation/http/{TemaController.ts,routes.ts}`, `apps/backend-api/src/infrastructure/seed/temaCatalog.ts`, `apps/mobile-app/src/screens/HomeScreen.{tsx,validation.ts}`, ADR-012.

**Hallazgos**:
1. **Sin hallazgos de OWASP Top 10**: `GET /temas` es de solo lectura, sin request body/params que validar -- ninguna superficie de inyección nueva. Protegido con `requireAuth` (mismo middleware Bearer que el resto de rutas), consistente con el resto del contrato, aunque el dato en sí no sea sensible (catálogo de referencia, igual para cualquier usuario).
2. **Sin secretos ni dependencias nuevas**: `temaCatalog.ts` es contenido editorial público (mismo catálogo ya publicado en ADR-006, un documento del propio repo); ninguna librería nueva instalada.
3. **Cliente**: `mode`/`academicLevel`/`topic` en `HomeScreen` se eligen de listas cerradas (enum fijo o `code` del catálogo ya descargado), nunca texto libre -- sin superficie de inyección en el formulario. El filtrado client-side (`temasForLevel`) es solo UX; `StartSessionUseCase` sigue validando Tema/AcademicLevel server-side (flujo 1a), consistente con el criterio ya aplicado al guard de `(app)/_layout.tsx` (revisión 2026-08-10 anterior): el cliente nunca es el límite de autorización real.
4. **Sin regresión del hallazgo ya documentado** (revisión anterior, `(app)/_layout.tsx`): esta tarea no toca `fetchClient.ts` ni el manejo de 401 -- el hueco de sesión no invalidada ante un token caducado sigue igual, no se agrava ni se resuelve aquí.

**Decisión tomada**: sin cambios de código. Ningún hallazgo crítico ni bloqueante.

**Output generado**: esta entrada.

---

---
task_id: STATUS-045
date: 2026-08-10
agentes: [security]
flujo: [developer, security]
artefactos: [apps/mobile-app/src/store/sessionRouting.ts, apps/mobile-app/app/(app)/_layout.tsx, apps/mobile-app/src/api/fetchClient.ts]
estado: done
---

## 2026-08-10 — Revisión: `app/(app)/_layout.tsx` (guard + header global)

**Input**: el usuario pidió comprobar que la validación de Security de la tarea del guard/header (STATUS.md #45) es correcta antes de comitear — Security no se había ejecutado todavía para esa tarea. Revisión real contra el checklist de esta skill, no un registro de trámite.

**Contexto utilizado**: `apps/mobile-app/src/store/sessionRouting.ts`, `apps/mobile-app/app/(app)/_layout.tsx`, `apps/mobile-app/app/index.tsx`, `apps/mobile-app/app/_layout.tsx`, `apps/mobile-app/src/components/AppHeader/AppHeader.tsx`, `apps/mobile-app/src/api/fetchClient.ts`, ADR-012, ADR-015 (persistencia del `sessionToken`).

**Hallazgos**:
1. **Sin hallazgos de OWASP Top 10 en la superficie nueva**: el guard (`resolveSessionRoute`) es una decisión puramente de UX cliente — no es el límite de autorización real, que sigue siendo `authMiddleware` en `backend-api` (verifica el `Bearer` en cada petición, IDOR ya cubierto por la verificación de `session.userId` corregida en #Security 2026-08-07). Un atacante que se salte el guard cliente (DevTools, build modificado) no gana nada: cualquier llamada a la API seguiría exigiendo un token válido server-side. `AppHeader` solo lee `email`/`sessionToken` del propio `useSessionStore` (nunca los expone en la UI más allá del email, ya visible para el propio usuario) — sin fuga a logs ni a terceros.
2. **Sin secretos ni dependencias nuevas**: ningún literal sensible en el código añadido; no se instaló ninguna dependencia en esta tarea (`package.json` sin cambios).
3. **Validación de inputs**: no aplica — esta pieza no procesa ningún input de usuario (es routing/chrome, no un formulario).
4. **Cumplimiento ADR-012**: sin regresión — la persistencia del token sigue igual que ADR-015 la fijó (`expo-secure-store`/`localStorage`, riesgo de `localStorage` ya documentado y aceptado, no reabierto aquí).
5. **Hallazgo real, no bloqueante — sesión no se limpia ante un `sessionToken` caducado/revocado**: `fetchClient.ts` lanza un `Error` genérico ante cualquier respuesta `!response.ok` (incluido 401), pero nada captura ese caso para invalidar `useSessionStore` — antes de esta tarea no había ningún guard que dependiera de "hay token", así que el problema no era observable; ahora que `(app)/_layout.tsx` trata "hay `sessionToken`" como "autenticado", un token caducado deja al usuario dentro de las pantallas protegidas viendo errores de query en vez de ser devuelto a login. No es una vulnerabilidad de acceso no autorizado (el servidor sigue rechazando la petición igualmente), es un hueco de gestión de sesión/UX. **No corregido en esta tarea** — cambia el contrato de `fetchClient` (necesitaría un interceptor de 401 que llame a `useSessionStore.logout()`), fuera del alcance pedido ("verifica Security y comitea"); queda señalado aquí como siguiente hallazgo a resolver, mismo criterio que el resto de huecos documentados y diferidos de la sesión (p. ej. HTTPS en `.env.example`, 2026-08-09).

**Decisión tomada**: sin cambios de código — ningún hallazgo crítico ni bloqueante. El hallazgo #5 queda registrado para una tarea futura (interceptor de 401 en `fetchClient` + `logout()`), no bloquea el commit de #45.

**Output generado**: esta entrada.

---

---
task_id: STATUS-041
date: 2026-08-09
agentes: [security]
flujo: [security]
artefactos: [packages/shared-utils/src/index.ts, apps/mobile-app/src/screens/LoginScreen.tsx, apps/mobile-app/.env.example]
estado: done
---

## 2026-08-09 — Revisión retroactiva: shared-utils (email/password) + LoginScreen

**Input**: El usuario detectó que Security no había registrado ninguna entrada para la tarea de `LoginScreen`/`shared-utils` ("security no ha escrito accion alguna") pese a tocar validación de credenciales — mismo tipo de hueco de proceso ya detectado una vez en la sesión (STATUS.md #28: Reviewer/Security nunca invocados). Revisión real contra el checklist de esta skill (OWASP Top 10, gestión de secretos, validación de inputs, dependencias, cumplimiento ADR-012), no solo un registro de trámite.

**Contexto utilizado**: `packages/shared-utils/src/index.ts` (`isValidEmail`, `isValidPassword`/`MIN_PASSWORD_LENGTH`), `apps/backend-api/src/application/use-cases/{RegisterUseCase,LoginUseCase}.ts`, `apps/mobile-app/src/screens/{LoginScreen.tsx,LoginScreen.validation.ts}`, `apps/mobile-app/src/api/fetchClient.ts`, [ADR-012](../../docs/ADR/ADR-012_linea_base_seguridad.md) §1/§4.

**Hallazgos**:
1. **Sin regresión en el mensaje genérico de login** (ADR-012 §4, US-002 AC "sin indicar cuál de los dos datos falló"): confirmado que `LoginScreen` solo muestra `login.error.message` tal cual lo devuelve `LoginUseCase` (`INVALID_CREDENTIALS_MESSAGE`, idéntico para email inexistente y contraseña incorrecta) — los errores de campo (`fieldErrors.email`/`.password`) son puramente de formato/longitud, evaluados en cliente ANTES de cualquier petición de red, por lo que no pueden filtrar si una cuenta existe.
2. **Sin superficie de inyección nueva**: `email`/`password` viajan como body JSON (`fetchClient`, `JSON.stringify`), nunca concatenados en SQL/HTML/URL. Lo único que se renderiza de vuelta al usuario son cadenas fijas (mensaje genérico del backend, textos de error en español de `validateLoginForm`) — nada derivado de input crudo se refleja en la UI, sin riesgo de XSS reflejado.
3. **Sin secretos ni dependencias nuevas**: `MIN_PASSWORD_LENGTH=8` es una política pública (OWASP ASVS L1, no sensible). `@mathmind/shared-utils` es un paquete interno del propio monorepo, no una dependencia de terceros — sin superficie de cadena de suministro nueva.
4. **Riesgo real, no introducido por esta tarea pero ahora relevante por primera vez**: `EXPO_PUBLIC_API_BASE_URL` (`apps/mobile-app/.env.example`) por defecto es `http://localhost:3000` — es la primera vez que una contraseña real viaja por `fetchClient`; en producción, si esa variable no se fija a `https://`, la contraseña circularía en texto claro por la red (riesgo de tráfico, distinto de "nunca en texto plano" de ADR-012 §4, que cubre almacenamiento en BBDD). No es un defecto de código — es configuración de despliegue. Corregido con un comentario de advertencia explícito en `.env.example`; la aplicación real de HTTPS queda para DevOps Agent cuando exista un entorno de despliegue real.
5. **Limitación de `isValidEmail` documentada, no corregida**: acepta dominios con puntos consecutivos (p. ej. `a@b..com`) — formato técnicamente inválido pero sin impacto de seguridad (es validación de UX en cliente; el backend nunca ha validado formato de email, ni antes ni ahora — solo existencia vía `findByEmail`). No se trata como hallazgo de seguridad, solo como nota de calidad menor.

**Decisión tomada**: sin cambios de código más allá del comentario en `.env.example` — el resto de la superficie revisada ya cumple ADR-012 sin modificaciones. Ningún hallazgo crítico ni secreto detectado.

**Output generado**: `apps/mobile-app/.env.example` actualizado (advertencia HTTPS). Esta entrada.

---

---
task_id: STATUS-011
date: 2026-08-05
agentes: [security]
flujo: [security]
artefactos: [docs/ADR/ADR-012_linea_base_seguridad.md, .ai/AGENTS.md]
estado: done
---

## 2026-08-05 — ADR-012 Línea Base de Seguridad (sustituye a docs/ADR/Security/)

**Input**: El usuario añadió una sección "Línea base de seguridad" en `.ai/AGENTS.md` y un paquete de 5 ADR (`docs/ADR/Security/`, ADR-007 a ADR-011: aislamiento de secretos, prompt injection, RBAC de agentes, filtrado de contexto, clasificación de datos LLM) pidiendo revisión y feedback.

**Contexto utilizado**: STATUS.md (Implementación al 0%), ADR-004 (dominio), ADR-005 (motor de dificultad), ADR-006 (taxonomía), UC-001/UC-003 (únicos puntos donde el sistema construye prompts hacia Qwen), US-001/US-002 (registro/login pendientes).

**Decisión tomada**: Se identificó que el paquete original modelaba una postura de seguridad de plataforma en producción (Vault, RBAC formal, Zero Trust) desproporcionada para el estado real del proyecto, y que aseguraba principalmente a los agentes de desarrollo entre sí sin cubrir el riesgo real del producto (prompt injection en UC-001/UC-003, datos de menores dado que `AcademicLevel.Primaria` implica usuarios potencialmente menores de 14 años). Se eliminó `docs/ADR/Security/` completo (5 ADR + README + archivo `_.tmp` suelto) y se sustituyó por un único ADR-012 con una línea base proporcionada: gestión de secretos ya aplicable, protección de prompt injection acotada a los dos UC reales, protección de datos de menores, y regla mínima de contraseñas — dejando explícitamente diferido (no descartado) el modelo RBAC/Vault completo como posible trabajo futuro si el proyecto escala a producción real.

**Output generado**: [docs/ADR/ADR-012_linea_base_seguridad.md](../../docs/ADR/ADR-012_linea_base_seguridad.md). Actualizado `.ai/AGENTS.md` (sección "Línea base de seguridad" apunta ahora a ADR-012 en vez del paquete eliminado).

---

---
task_id: STATUS-017
date: 2026-08-06
agentes: [security]
flujo: [architecture, security]
artefactos: [.ai/skills/*.md, .ai/AGENTS.md]
estado: done
---

## 2026-08-06 — Revisión de `.ai/skills/*.md` + referencias a ADR-012

**Input**: Solicitud de revisar si las 11 skills (`.ai/skills/`) están bien definidas. Se encontraron 5 problemas reales (no solo de estilo): (1) ruta `Architecture.md` mal escrita (debía ser `ARCHITECTURE.md`) repetida en varias skills y en `AGENTS.md`; (2) aparente contradicción entre `security.md` ("no introducir nuevas dependencias") y `ADR-012` (exige bcrypt/argon2) — descartada tras aclaración del usuario: Security Agent audita, Developer Agent implementa (sin esa restricción); (3) `reviewer.md` asume flujo de Pull Request pese a que el repo no está inicializado como git (`git status` verificado); (4) solape de `Salidas` entre `architecture.md` y `documentation.md` (ambas reclaman ADRs/ARCHITECTURE.md); (5) ejemplos de `knowledge-manager.md` desincronizados del código real (citan "ADR-003 Exercise Caching Strategy" inexistente, "Difficulty Calculator" en vez de `AdaptiveDifficultyEngine`, convención `.spec.ts` cuando el proyecto usa `.test.ts`).

**Contexto utilizado**: los 11 archivos de `.ai/skills/`, `.ai/AGENTS.md`, `ADR-012`, y verificación real con `git status` (no simulada).

**Decisión tomada**: (Punto 1, resuelto) 8 correcciones de `Architecture.md`→`ARCHITECTURE.md`. (Punto 2, resuelto por aclaración del usuario) sin cambio de código, solo se documentó la división de responsabilidades Security-audita/Developer-implementa directamente en `security.md`. Además, a petición explícita del usuario: se añadió referencia a `ADR-012` en las 11 skills (línea en `Restricciones`: "Debe respetar la línea base de seguridad (ADR-012)"), con tratamiento reforzado en `security.md` (también en `Entradas` y `Checklist`, más la aclaración de la división de responsabilidad con Developer Agent). Puntos 3, 4 y 5 quedan pendientes de confirmación del usuario, no resueltos todavía.

**Output generado**: `.ai/skills/{architecture,director,orchestrator,knowledge-manager}.md` (fix de ruta), `.ai/AGENTS.md` (fix de ruta), y las 11 skills en `.ai/skills/` con referencia a ADR-012 añadida.

---

---
task_id: STATUS-028
date: 2026-08-07
agentes: [security]
flujo: [developer, reviewer, security, documentation]
artefactos: [apps/backend-api/src/application/use-cases/RegisterUseCase.ts, apps/backend-api/src/application/use-cases/LoginUseCase.ts, apps/backend-api/src/infrastructure/auth/JwtTokenIssuer.ts]
estado: done
---

## 2026-08-07 — Primera pasada real sobre código de autenticación (Register/Login, JWT, bcrypt, IDOR)

**Input**: El usuario detectó que Security Agent no se había invocado al implementar Register/Login/autenticación pese a que `.ai/AGENTS.md` lo exige como fase obligatoria del flujo. Correcto — esta es la primera pasada real de Security sobre código de autenticación desde que se implementó.

**Contexto utilizado**: `.ai/skills/security.md` (checklist: OWASP Top 10, gestión de secretos, validación de inputs, dependencias revisadas, ADR-012), ADR-012 (hash bcrypt/argon2 — cumplido; mensajes de login genéricos — cumplido en `LoginUseCase`, no en las rutas). Alcance: `RegisterUseCase`, `LoginUseCase`, `JwtTokenIssuer`, `BcryptPasswordHasher`, `authMiddleware`, `routes.ts`.

**Hallazgos**:
1. **CONFIRMADO — fuga de información por mensajes de error (`routes.ts`)**: `handleError` reenvía `error.message` tal cual al cliente para toda ruta. Para `/sessions/end`, `/answers`, `/hints` (las tres protegidas por la verificación de autorización IDOR) esto permite distinguir "sesión inexistente" ("No active session: X") de "sesión de otro usuario" ("Session X does not belong to user Y") — dos textos distintos que confirman a un atacante la existencia de un `sessionId` ajeno, aunque no pueda actuar sobre él. Mismo principio de mensaje genérico que `LoginUseCase` ya aplica correctamente, pero no se llevó a las rutas. **A corregir.**
2. **CONFIRMADO — sin política de contraseña (`RegisterUseCase`)**: US-001 y ADR-012 dejaban la política de contraseñas "a definir al implementar" — la implementación ya ocurrió y no se definió ninguna. Hoy se acepta una contraseña de 1 carácter. **A corregir** con un mínimo razonable (8 caracteres, alineado con OWASP ASVS L1 — longitud sobre complejidad).
3. **Hardening recomendado, no vulnerabilidad explotable hoy (`JwtTokenIssuer.verify`)**: no fija `algorithms: ['HS256']` en `jwt.verify`. El ataque clásico de confusión de algoritmo (RS256→HS256) no aplica a este sistema porque nunca se usa RS256 ni claves asimétricas en ningún punto — pero fijar el algoritmo explícitamente es buena práctica de defensa en profundidad y coste casi nulo. **A corregir.**
4. **Sin hallazgos**: gestión de secretos (`JWT_SECRET` solo por variable de entorno, nunca hardcodeado, `.env.example` vacío — cumple ADR-012), hash de contraseñas (bcrypt, 12 salt rounds, dentro del rango recomendado), dependencias (`bcrypt@6.0.0`, `jsonwebtoken@9.0.3`, ambas versiones actuales; `npm audit` no señaló vulnerabilidades nuevas atribuibles a ellas al instalarlas). Rate limiting / MFA / OAuth: ya diferidos explícitamente en ADR-012, no se reabren aquí. CORS/Helmet: no configurados, pero el consumidor es una app móvil (no un navegador sujeto a CORS) — riesgo bajo, no bloqueante para el alcance actual.

**Decisión tomada**: 3 hallazgos confirmados, priorizados por severidad real (1 y 2 tienen impacto de seguridad genuino; 3 es hardening preventivo). Pasan al Developer Agent para corrección con TDD — ver `.ai/prompts/developer.md`.

**Output generado**: esta entrada.

---

---
task_id: STATUS-063
date: 2026-08-21
agentes: [security]
flujo: [product, architecture, test, developer, reviewer, security, documentation]
artefactos: [apps/backend-api/src/application/use-cases/GuestLoginUseCase.ts, apps/backend-api/src/presentation/http/routes.ts, apps/mobile-app/src/api/fetchClient.ts]
estado: done
---

## 2026-08-21 — US-009 "Prueba sin registrarte" (creación anónima de cuentas)

**Input**: El usuario (Project Director) pidió pasar Security sobre US-009 antes de comitear, si no hay objeciones.

**Contexto utilizado**: `.ai/skills/security.md` (checklist: OWASP Top 10, gestión de secretos, validación de inputs, dependencias, ADR-012), `ADR-012` (línea base de seguridad ya aceptada: sin rate limiting/MFA, diferido explícitamente). Alcance: `GuestLoginUseCase`, `routes.ts` (`/auth/guest`), `fetchClient.ts` (nueva ruta pública).

**Hallazgos**:
1. **No bloqueante, nueva superficie a vigilar — creación de cuentas sin ninguna credencial ni fricción**: `POST /auth/guest` no exige nada del cliente (sin body, sin email/password propios) — es la ruta más trivial de automatizar de las tres de auth para generar filas `User` sin límite (crecimiento de base de datos, no denegación de servicio real dado que cada alta es barata). No es una vulnerabilidad nueva de por sí: ADR-012 ya deja diferido explícitamente el rate limiting para **todo** el sistema, no solo para esta ruta — pero esta ruta es la que más invita a automatizarlo, al no requerir ni siquiera un email distinto por intento. Ningún cambio de código en esta pasada (Security no introduce dependencias nuevas per sus Restricciones; un rate limiter sería una dependencia nueva, decisión de alcance mayor que esta historia). Recomendado como trabajo futuro si el proyecto escala más allá del TFM.
2. **Sin hallazgos** en gestión de secretos (el password derivado de la IP se hashea con el mismo `BcryptPasswordHasher` que el resto de altas — nunca se persiste ni se devuelve en texto plano, ni siquiera en la respuesta del endpoint), inyección/validación de inputs (sin request body que validar — todos los datos se generan en el servidor), ni cumplimiento de ADR-012 (mismo mínimo de contraseña de 8 caracteres aplicado vía `RegisterUseCase`, sin excepción para el flujo de invitado; dominio sintético `invitado.mathmind.local`, no resoluble, sin riesgo de envío accidental de correo). Confirmado además que `fetchClient.ts` (mobile-app) ya no intentaba adjuntar `Authorization` a esta ruta pública tras el fix aplicado en la misma tarea (`PUBLIC_PATHS` ampliado).

**Decisión tomada**: ningún hallazgo bloqueante. El hallazgo #1 queda como riesgo aceptado y documentado (mismo criterio ya fijado en ADR-012 para el resto del sistema), no un hallazgo nuevo que esta historia deba resolver por sí sola.

**Output generado**: esta entrada.