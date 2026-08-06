# User Stories

Historias de usuario de MathMind AI, generadas por el Product Agent siguiendo [.ai/skills/product.md](../../.ai/skills/product.md): formato Como/Quiero/Para, principio INVEST, criterios de aceptación en Gherkin (Given/When/Then). No incluyen diseño técnico ni de arquitectura — eso es responsabilidad del Architecture Agent ([ADR-002](../ADR-002_Agentes.md)).

Origen: lista candidata de [STATUS.md](../STATUS.md) (pendiente #4).

## Índice

| ID | Título | Actor | Casos de Uso relacionados |
|---|---|---|---|
| [US-001](US-001-registro.md) | Registro | Visitante | — |
| [US-002](US-002-login.md) | Login | Usuario registrado | — |
| [US-003](US-003-iniciar-sesion-entrenamiento.md) | Iniciar Sesión de Entrenamiento | Usuario autenticado | UC-005 Start Session |
| [US-004](US-004-resolver-ejercicio.md) | Resolver Ejercicio | Usuario en sesión activa | UC-001 Generate Exercise, UC-002 Validate Answer, UC-004 Update Difficulty |
| [US-005](US-005-solicitar-pista.md) | Solicitar Pista | Usuario en sesión activa (Modo Resolución) | UC-003 Generate Hint |
| [US-006](US-006-finalizar-sesion.md) | Finalizar Sesión | Usuario en sesión activa | UC-006 End Session |
| [US-007](US-007-ver-estadisticas.md) | Ver Estadísticas | Usuario registrado | Sin UC asignado todavía — ver nota |

## Nota de trazabilidad

**US-002 vs. US-003**: no son la misma historia pese al nombre similar. US-002 es autenticación (`Login`). US-003 es arrancar una `Session` de entrenamiento (entidad de [ADR-004](../ADR/ADR-004_domain.md)) una vez ya autenticado — elegir modo, nivel y tema.

**US-007 sin caso de uso**: los seis Casos de Uso listados en STATUS.md (UC-001 a UC-006) no cubren "ver estadísticas". Al definir Casos de Uso (pendiente #5), falta añadir un UC-007 (p. ej. `GetUserStatistics`) que sirva a esta historia.

Registrado en `.ai/prompts/product.md`.
