# User Stories

Historias de usuario de MathMind AI, generadas por el Product Agent siguiendo [.ai/skills/product.md](../../.ai/skills/product.md): formato Como/Quiero/Para, principio INVEST, criterios de aceptación en Gherkin (Given/When/Then). No incluyen diseño técnico ni de arquitectura — eso es responsabilidad del Architecture Agent ([ADR-002](../ADR-002_Agentes.md)).

Origen: lista candidata de [STATUS.md](../STATUS.md) (pendiente #4).

## Índice

| ID | Título | Actor | Casos de Uso relacionados | Pantalla `mobile-app` |
|---|---|---|---|---|
| [US-001](US-001-registro.md) | Registro | Visitante | — | `(auth)/register` |
| [US-002](US-002-login.md) | Login | Usuario registrado | — | `(auth)/login` |
| [US-003](US-003-iniciar-sesion-entrenamiento.md) | Iniciar Sesión de Entrenamiento | Usuario autenticado | UC-005 Start Session | `(app)/home` |
| [US-004](US-004-resolver-ejercicio.md) | Resolver Ejercicio | Usuario en sesión activa | UC-001 Generate Exercise, UC-002 Validate Answer, UC-004 Update Difficulty | `(app)/session/[sessionId]` |
| [US-005](US-005-solicitar-pista.md) | Solicitar Pista | Usuario en sesión activa (Modo Resolución) | UC-003 Generate Hint | `(app)/session/[sessionId]` (misma pantalla, no ruta propia) |
| [US-006](US-006-finalizar-sesion.md) | Finalizar Sesión | Usuario en sesión activa | UC-006 End Session | `(app)/session/[sessionId]` (acción) + `(app)/session/[sessionId]/summary` (resultado) |
| [US-007](US-007-ver-estadisticas.md) | Ver Estadísticas | Usuario registrado | Sin UC asignado todavía — ver nota | `(app)/statistics` |
| [US-008](US-008-subir-material-rag.md) | Consolidar Base de Conocimiento (RAG) | Administrador del sistema | [UC-011](../use-cases/UC-011-ingest-knowledge-base.md) Ingest Knowledge Base | — (acceso directo al servidor, sin pantalla) |
| [US-009](US-009-acceso-invitado.md) | Acceso rápido sin registro | Visitante | Sin UC asignado todavía — reutiliza el alta de US-001 | `(auth)/login` |

## Nota de trazabilidad

**US-002 vs. US-003**: no son la misma historia pese al nombre similar. US-002 es autenticación (`Login`). US-003 es arrancar una `Session` de entrenamiento (entidad de [ADR-004](../ADR/ADR-004_domain.md)) una vez ya autenticado — elegir modo, nivel y tema.

**US-007 sin caso de uso**: los seis Casos de Uso listados en STATUS.md (UC-001 a UC-006) no cubren "ver estadísticas". Al definir Casos de Uso (pendiente #5), falta añadir un UC-007 (p. ej. `GetUserStatistics`) que sirva a esta historia.

**US-008 → UC-011**: [UC-011](../use-cases/UC-011-ingest-knowledge-base.md) (Ingest Knowledge Base) cierra el hueco, definido en [ADR-014](../ADR/ADR-014_rag.md) junto con las decisiones que esta historia dejaba en "Fuera de alcance" (asociación fichero↔Tema, tecnología de indexado vectorial, persistencia del registro de ingesta).

**Columna "Pantalla `mobile-app`"**: mapeo fijado en [ADR-015](../ADR/ADR-015_mobile_app_screens.md), no una decisión de producto — las User Stories siguen sin diseño técnico, la columna solo referencia dónde vive cada una en la app.

**US-009 sin caso de uso todavía**: reutiliza el mecanismo de alta de US-001 (Registro) con datos autogenerados, pero el "Fuera de alcance" de esa historia deja explícitamente para Architecture si eso significa reutilizar `POST /auth/register` desde el cliente o un endpoint dedicado — falta formalizar junto con el resto del diseño técnico, solicitada directamente por el usuario (Project Director) el 2026-08-20 para facilitar la corrección del TFM.

Registrado en `.ai/prompts/product.md`.
