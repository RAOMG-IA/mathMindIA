# Estado del Proyecto

> Documento vivo — se actualiza libremente según avanza el trabajo. No es un ADR: no registra decisiones estables, solo progreso. Para decisiones, ver [ADR-000](ADR-000_Estructura.md) y siguientes.

## Pendientes Prioritarios

### 1. ~~DOMAIN.md~~ ✅

Completado como [ADR-004_domain.md](ADR-004_domain.md).

### 2. ~~ADR-005 Adaptive Difficulty Engine~~ ✅

Completado como [ADR-005](ADR/ADR-005-adaptive-difficulty-engine.md).

### 3. ~~math-topics.md~~ ✅

Completado como [ADR-006_math_topics.md](ADR/ADR-006_math_topics.md).

### 4. ~~User Stories~~ ✅

Completadas en [docs/user-stories/](user-stories/). US-003 renombrada a "Iniciar Sesión de Entrenamiento" para no confundirse con US-002 Login. US-007 quedó sin caso de uso asignado — pendiente añadir UC-007 al definir Casos de Uso (#5).

### 5. ~~Casos de Uso~~ ✅

Completados en [docs/use-cases/](use-cases/). UC-001 original se dividió en UC-001 (Generate Exercise, Batch/IA) y UC-008 (Select Next Exercise, tiempo real/determinista). Se añadió UC-007 (Get User Statistics) para cerrar el hueco de US-007.

### 6. ~~Línea Base de Seguridad~~ ✅

Completada como [ADR-012_linea_base_seguridad.md](ADR/ADR-012_linea_base_seguridad.md), referenciada desde `.ai/AGENTS.md`. Sustituye a un paquete inicial de 5 ADR (`docs/ADR/Security/`, eliminado) que modelaba una postura de seguridad de plataforma en producción (Vault, RBAC formal, Zero Trust) desproporcionada para el estado actual del proyecto y centrada en proteger a los agentes de desarrollo entre sí en vez del producto. ADR-012 cubre en su lugar lo aplicable ahora: gestión de secretos, prompt injection acotado a UC-001/UC-003, protección de datos de menores (relevante por `AcademicLevel.Primaria`), y regla mínima de contraseñas.

## Estado Actual

| Área | Estado |
|---|---|
| Visión Producto | ✅ 100% |
| Arquitectura | ✅ 95% |
| Monorepo | ✅ 95% (scaffolding creado, `npm install` y `turbo typecheck` verificados en verde — 13/13 tareas) |
| Sistema Multiagente | ✅ 95% |
| Documentación | ✅ 90% |
| Dominio | ✅ 100% diseño + contratos de repositorio materializados como TS real en `packages/shared-domain` (VOs, entidades, 5 repositorios) |
| Casos de Uso | ✅ 100% (UC-001 a UC-008) |
| Seguridad | ✅ 100% línea base (ADR-012); RBAC/Vault/Zero Trust diferidos deliberadamente, ver "Fuera de alcance" del ADR |
| Contratos IA | ✅ 90% forma de datos (DTOs API + contrato Qwen) materializada como TS real; falta validación en tiempo de ejecución del contrato Qwen (librería sin decidir) |
| Modelo de Datos Físico | ✅ 100% [ADR-013](ADR/ADR-013_modelo_datos_fisico.md) + `database/schema.prisma` real, verificado con `prisma validate`/`generate`; faltan migraciones reales e implementaciones de repositorio |
| Implementación | ⏳ 5% — primer ciclo TDD completo: `AdaptiveDifficultyEngine.computeNextDifficulty` implementado y testeado (8/8 verde), primera pieza de lógica de negocio real del proyecto. Resto sigue en 0%. |

## Próximo Paso Recomendado

1. ~~DOMAIN.md~~ ✅
2. ~~ADR-005 Adaptive Difficulty Engine~~ ✅
3. ~~math-topics.md~~ ✅
4. ~~User Stories~~ ✅
5. ~~Casos de Uso~~ ✅
6. ~~Scaffolding de `apps/`+`packages/`~~ ✅ (npm workspaces + Turborepo, solo tooling/estructura — ver `.ai/prompts/architecture.md`)
7. ~~`npm install` + `turbo typecheck`~~ ✅ (13/13 tareas correctas tras corregir `langchain` a `^1.5.0` — la versión `^0.3.0` inicial chocaba con `@langchain/core` 1.x)

10. ~~Decidir librería de navegación para `mobile-app`~~ ✅ Expo Router — registrado en [ADR-001](ADR-001_LenguajesMetodologias.md), `apps/mobile-app/app/` con enrutado por archivos.
11. ~~Línea Base de Seguridad~~ ✅ [ADR-012](ADR/ADR-012_linea_base_seguridad.md), sustituye al paquete `docs/ADR/Security/` eliminado.
12. ~~Contratos de repositorio~~ ✅ `packages/shared-domain/src/{value-objects,entities,repositories}` — TypeScript real (sin lógica), verificado con `turbo typecheck`/`lint`. `email` añadido a `User` (hueco detectado al tipar `findByEmail`).
13. ~~Contratos de frontera (DTOs API + contrato Qwen)~~ ✅ `packages/shared-types/src/dtos` (7 DTOs) y `apps/ai-engine/src/prompts` (GenerateExercise/GenerateHint). `ExercisePublicDto` excluye `correctAnswer`/`explanation`/`difficulty` deliberadamente. Hueco detectado: `hintsUsed` necesita contador efímero (Redis) antes de que exista `Answer` — no resuelto, documentado en `Hint.ts`. Validación en tiempo de ejecución del contrato Qwen sigue pendiente (librería sin decidir).
14. ~~Modelo de Datos Físico~~ ✅ [ADR-013](ADR/ADR-013_modelo_datos_fisico.md) — hueco detectado por el usuario al revisar US-001 (no había esquema ni ORM ratificado). Prisma confirmado. `database/schema.prisma` verificado con `prisma validate`/`generate` reales.
15. ~~Tests de `AdaptiveDifficultyEngine`~~ ✅ (TDD Red) `packages/shared-domain/src/services/AdaptiveDifficultyEngine.test.ts` — 8 casos, valores calculados a mano contra ADR-005, trazados a US-004. Hueco real detectado y documentado en ADR-005: el K provisional (cold start) necesita un contador de intentos por nivel que no existe en `User` — diferido.
16. ~~Implementación de `computeNextDifficulty`~~ ✅ (TDD Green) Primer ciclo TDD completo del proyecto. `vitest run` → 8/8 en verde a la primera. Hueco preexistente detectado y corregido de paso: `turbo run test` fallaba en toda regla para paquetes sin tests (`vitest run` sale con código 1 sin tests) — se añadió `--passWithNoTests` a los 8 `package.json` con script `test`.

Con el primer ciclo Red→Green completo, el patrón queda establecido para el resto de lógica de negocio (casos de uso, resto de servicios de dominio): User Story + AC → Tests (Test Agent) → Implementación (Developer Agent), cada fase con confirmación explícita del usuario antes de avanzar a la siguiente.
