# Security Agent
Review OWASP Top 10 risks, secrets, dependencies and validation.

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

## 2026-08-05 — ADR-012 Línea Base de Seguridad (sustituye a docs/ADR/Security/)

**Input**: El usuario añadió una sección "Línea base de seguridad" en `.ai/AGENTS.md` y un paquete de 5 ADR (`docs/ADR/Security/`, ADR-007 a ADR-011: aislamiento de secretos, prompt injection, RBAC de agentes, filtrado de contexto, clasificación de datos LLM) pidiendo revisión y feedback.

**Contexto utilizado**: STATUS.md (Implementación al 0%), ADR-004 (dominio), ADR-005 (motor de dificultad), ADR-006 (taxonomía), UC-001/UC-003 (únicos puntos donde el sistema construye prompts hacia Qwen), US-001/US-002 (registro/login pendientes).

**Decisión tomada**: Se identificó que el paquete original modelaba una postura de seguridad de plataforma en producción (Vault, RBAC formal, Zero Trust) desproporcionada para el estado real del proyecto, y que aseguraba principalmente a los agentes de desarrollo entre sí sin cubrir el riesgo real del producto (prompt injection en UC-001/UC-003, datos de menores dado que `AcademicLevel.Primaria` implica usuarios potencialmente menores de 14 años). Se eliminó `docs/ADR/Security/` completo (5 ADR + README + archivo `_.tmp` suelto) y se sustituyó por un único ADR-012 con una línea base proporcionada: gestión de secretos ya aplicable, protección de prompt injection acotada a los dos UC reales, protección de datos de menores, y regla mínima de contraseñas — dejando explícitamente diferido (no descartado) el modelo RBAC/Vault completo como posible trabajo futuro si el proyecto escala a producción real.

**Output generado**: [docs/ADR/ADR-012_linea_base_seguridad.md](../../docs/ADR/ADR-012_linea_base_seguridad.md). Actualizado `.ai/AGENTS.md` (sección "Línea base de seguridad" apunta ahora a ADR-012 en vez del paquete eliminado).

---

## 2026-08-06 — Revisión de `.ai/skills/*.md` + referencias a ADR-012

**Input**: Solicitud de revisar si las 11 skills (`.ai/skills/`) están bien definidas. Se encontraron 5 problemas reales (no solo de estilo): (1) ruta `Architecture.md` mal escrita (debía ser `ARCHITECTURE.md`) repetida en varias skills y en `AGENTS.md`; (2) aparente contradicción entre `security.md` ("no introducir nuevas dependencias") y `ADR-012` (exige bcrypt/argon2) — descartada tras aclaración del usuario: Security Agent audita, Developer Agent implementa (sin esa restricción); (3) `reviewer.md` asume flujo de Pull Request pese a que el repo no está inicializado como git (`git status` verificado); (4) solape de `Salidas` entre `architecture.md` y `documentation.md` (ambas reclaman ADRs/ARCHITECTURE.md); (5) ejemplos de `knowledge-manager.md` desincronizados del código real (citan "ADR-003 Exercise Caching Strategy" inexistente, "Difficulty Calculator" en vez de `AdaptiveDifficultyEngine`, convención `.spec.ts` cuando el proyecto usa `.test.ts`).

**Contexto utilizado**: los 11 archivos de `.ai/skills/`, `.ai/AGENTS.md`, `ADR-012`, y verificación real con `git status` (no simulada).

**Decisión tomada**: (Punto 1, resuelto) 8 correcciones de `Architecture.md`→`ARCHITECTURE.md`. (Punto 2, resuelto por aclaración del usuario) sin cambio de código, solo se documentó la división de responsabilidades Security-audita/Developer-implementa directamente en `security.md`. Además, a petición explícita del usuario: se añadió referencia a `ADR-012` en las 11 skills (línea en `Restricciones`: "Debe respetar la línea base de seguridad (ADR-012)"), con tratamiento reforzado en `security.md` (también en `Entradas` y `Checklist`, más la aclaración de la división de responsabilidad con Developer Agent). Puntos 3, 4 y 5 quedan pendientes de confirmación del usuario, no resueltos todavía.

**Output generado**: `.ai/skills/{architecture,director,orchestrator,knowledge-manager}.md` (fix de ruta), `.ai/AGENTS.md` (fix de ruta), y las 11 skills en `.ai/skills/` con referencia a ADR-012 añadida.

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