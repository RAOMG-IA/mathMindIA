# ADR-012: Línea Base de Seguridad

## Estado

Propuesto

## Contexto

`.ai/AGENTS.md` fija una "Línea base de seguridad" transversal: restricciones de acceso que aplican a **todos** los agentes de desarrollo (no solo al Security Agent, cuyas propias obligaciones ya están descritas en su sección de `AGENTS.md`). Originalmente esa línea base se apoyaba en un paquete de 5 ADR (`docs/ADR/Security/`, ADR-007 a ADR-011) que modelaban Vault/Secrets Manager dedicado, credenciales efímeras, RBAC formal entre agentes y Zero Trust — una postura de seguridad de plataforma en producción, desproporcionada para un proyecto con Implementación al 0% ([STATUS.md](../STATUS.md)) y sin infraestructura que la soporte. Además, esos ADR aseguraban principalmente a los **agentes de desarrollo entre sí**, sin cubrir el riesgo real del **producto** MathMind AI.

Este ADR los sustituye por una línea base proporcionada al estado real del proyecto, anclada en lo que ya existe: [ADR-004](ADR-004_domain.md) (dominio), [ADR-005](ADR-005-adaptive-difficulty-engine.md) (motor de dificultad), [ADR-006](ADR-006_math_topics.md) (taxonomía), y los Casos de Uso ya definidos ([docs/use-cases](../use-cases/)).

### Superficie de riesgo real identificada

- **Prompt injection real**: [UC-001](../use-cases/UC-001-generate-exercise-batch.md) (Generate Exercise, Batch) y [UC-003](../use-cases/UC-003-generate-hint.md) (Generate Hint) son los únicos dos puntos donde el sistema construye prompts hacia Qwen. Ninguno de los ADR-SEC originales mencionaba esto — se centraban en RAG interno entre agentes de desarrollo, no en el flujo del producto.
- **Datos de menores**: `AcademicLevel.Primaria` ([ADR-004](ADR-004_domain.md)) implica usuarios potencialmente menores de 14 años. Ningún ADR-SEC original lo mencionaba.
- **Secretos ya existentes**: `apps/backend-api/.env.example` (`AI_API_KEY`, `DATABASE_URL`, `REDIS_URL`) ya están scaffoldeados y cubiertos por `.gitignore`.
- **Autenticación pendiente**: [US-001](../user-stories/US-001-registro.md) y [US-002](../user-stories/US-002-login.md) todavía no están implementadas, pero ya definen el comportamiento esperado (mensajes de error genéricos, etc.) — esta baseline fija la regla de manejo de contraseñas antes de que se implementen.

## Decisión

### 1. Gestión de secretos (aplicable ya)

- Todo secreto (`AI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, futuras claves de firma JWT) vive únicamente en variables de entorno — nunca en código, ADRs, documentación o registros de trazabilidad.
- Prohibido loguear valores de variables de entorno.
- Los agentes de desarrollo (Product, Architecture, Test, Developer, Reviewer, Documentation) trabajan solo sobre `.env.example` (plantillas sin valores). Solo Security y DevOps gestionan archivos `.env` reales.
- Cuando exista CI/CD (DevOps Agent, pendiente), los secretos se inyectan como variables de entorno del pipeline, nunca como archivo versionado.
- **Diferido**: Vault/Secret Manager dedicado — se reevalúa solo si el proyecto pasa de TFM a producto con múltiples entornos/equipos reales.

### 2. Protección frente a prompt injection en el flujo del producto

- En UC-001 y UC-003, la entrada de usuario nunca se concatena directamente en el system prompt enviado a Qwen; se trata siempre como dato, no como instrucción (separación básica de rol system/user).
- El output de Qwen (enunciado, pista, explicación) se valida contra las invariantes de `Exercise`/`Hint` ([ADR-004](ADR-004_domain.md)) antes de persistir — ya definido como paso 4 de UC-001 por motivos de calidad; se adopta aquí también como control de seguridad.
- No se requiere la maquinaria completa de detección adversarial del ADR-008 original (filtros OWASP LLM Top 10, chunking etiquetado por sensibilidad) mientras el único contenido que entra en el prompt sea el catálogo de Temas (ADR-006) y metadatos del ejercicio — datos ya públicos por diseño, no contenido de usuario libre.

### 3. Datos de menores

- `User` ([ADR-004](ADR-004_domain.md)) se limita al mínimo dato necesario: email + nivel académico (ya así en [US-001](../user-stories/US-001-registro.md)).
- Los prompts hacia Qwen (UC-001, UC-003) nunca incluyen datos identificativos del usuario (email, nombre) — solo nivel académico, tema y dificultad.
- **Diferido**: mecanismo de consentimiento parental — se señala como requisito real antes de cualquier lanzamiento público, fuera del alcance de implementación del TFM.

### 4. Autenticación (base mínima para US-001/US-002)

- Contraseñas nunca en texto plano — hash con algoritmo estándar (bcrypt o argon2) al implementar.
- Mensajes de error de login genéricos, sin indicar qué campo falló (ya especificado en [US-002](../user-stories/US-002-login.md)).
- **Diferido**: MFA, login social/OAuth, límite de intentos — no bloquean el alcance actual.

### 5. Restricción transversal a agentes de desarrollo

Esta es la regla que respalda la "Línea base de seguridad" de `AGENTS.md`, distinta de las obligaciones propias del Security Agent:

- Ningún agente de desarrollo incluye valores de secretos reales en su registro de trazabilidad (`.ai/prompts/<agent>.md`) ni en ningún ADR — solo nombres de variable (p. ej. `AI_API_KEY`), nunca valores.
- Solo Security Agent y DevOps Agent gestionan y rotan secretos reales.

## Consecuencias

### Positivas

- Seguridad proporcional al estado real del proyecto — no bloquea el desarrollo con procesos para los que no hay infraestructura.
- Cubre el riesgo que los ADR-SEC originales no cubrían: prompt injection en el flujo real del producto y protección de datos de menores.
- Reutiliza validaciones ya definidas (invariantes de ADR-004, escenarios de US-001/US-002) en vez de duplicar controles.

### Negativas / Riesgos

- Deliberadamente menos exhaustivo que un modelo RBAC/Vault completo. Si el catálogo de Temas dejara de ser el único input al prompt (p. ej. si se permitiera texto libre del usuario hacia Qwen), esta baseline quedaría insuficiente y habría que revisar la protección de prompt injection con más profundidad.
- Si el proyecto escala a producción real con usuarios reales, esta baseline deberá revisarse — probablemente recuperando ideas del paquete ADR-SEC original (Vault, RBAC, clasificación de datos), que no se descarta como referencia futura, solo como gobierno obligatorio prematuro.

## Fuera de alcance

- Vault/Secret Manager dedicado, RBAC formal entre agentes, Zero Trust, clasificación de datos multinivel, rotación automática de credenciales, suite de pruebas adversariales — posible trabajo futuro si el proyecto pasa de TFM a producto real.
- Consentimiento parental / cumplimiento COPPA formal.
- MFA / OAuth / login social.

## Trazabilidad

Registrado en `.ai/prompts/security.md`.

---

## Adenda 2026-08-10: CORS (`CORS_ALLOWED_ORIGINS`)

**Contexto**: al verificar `mobile-app` en un navegador (Expo Web servido en `http://localhost:8081`) contra `backend-api` real (`http://localhost:3000`), el registro falló por CORS — `backend-api` no enviaba ninguna cabecera `Access-Control-Allow-*`, así que cualquier origen de navegador, incluido el propio `mobile-app`, quedaba bloqueado por defecto (comportamiento estándar del navegador sin CORS explícito, no un bug). El usuario pidió resolverlo con una allowlist configurable por entorno, explícito en que la privacidad no debía verse afectada (es decir: nada de `Access-Control-Allow-Origin: *`).

**Decisión**: nueva variable `CORS_ALLOWED_ORIGINS` (lista de orígenes separados por comas, sin wildcard). `isOriginAllowed()`/`parseAllowedOrigins()` (`apps/backend-api/src/presentation/http/corsConfig.ts`, TDD) rechazan por defecto — una variable sin definir o vacía bloquea **todo** origen de navegador, en vez de degradar a permisivo por error de configuración. Las peticiones sin cabecera `Origin` (apps nativas iOS/Android, `curl`, servidor-a-servidor) no se ven afectadas — CORS es un mecanismo que solo aplican los navegadores, y `mobile-app` en nativo (ADR-015, objetivo Android+iOS+Web) nunca envía esa cabecera.

Mismo tratamiento que el resto de configuración de red ya cubierta por esta línea base (§1, "todo secreto vive únicamente en variables de entorno"): aunque una lista de orígenes no es un secreto en sí, es configuración sensible de superficie de ataque, y sigue el mismo canal (`.env`/`.env.example`, nunca hardcodeada).

**Consecuencias**: cualquier despliegue nuevo (staging, producción, un origen web adicional) debe añadirse explícitamente a `CORS_ALLOWED_ORIGINS` — no hay auto-detección ni entorno de desarrollo permisivo por defecto. Documentado en `apps/backend-api/.env.example`.

Registrado también en `.ai/prompts/{architecture,developer,security}.md`.
