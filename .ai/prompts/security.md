# Security Agent
Review OWASP Top 10 risks, secrets, dependencies and validation.

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