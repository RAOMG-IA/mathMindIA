# ADR-013: Modelo de Datos Físico

## Estado

Propuesto

## Contexto

[ADR-004](ADR-004_domain.md) define el modelo de dominio (entidades, Value Objects) deliberadamente agnóstico de persistencia — Clean Architecture exige que el Domain no conozca PostgreSQL ni ningún ORM ("Diseño físico de tablas/índices... fuera de alcance", explícito en ese ADR). Como consecuencia, ese diseño físico nunca se llegó a definir en ningún sitio, hueco detectado al preguntarse qué falta para implementar [US-001](../user-stories/US-001-registro.md) (Registro).

`ARCHITECTURE.md` menciona "Prisma" una sola vez, como ítem suelto en una lista de ejemplos de la capa Infrastructure — nunca se ratificó como decisión (mismo patrón que la librería de navegación de `mobile-app`, resuelto en su momento con una pregunta directa). Este ADR lo formaliza y define el esquema físico.

**Por qué esto no viola la TDD Enforcement Rule ([ADR-003](../ADR-003_Trazabilidad.md))**: un `schema.prisma` es declarativo (define forma, no comportamiento) — análogo a los contratos de repositorio ya materializados en `packages/shared-domain`. No incluye implementaciones de `UserRepository` ni lógica de query; esas siguen esperando a Tests.

## Decisión

### ORM: Prisma

Confirmado explícitamente con el usuario. Motivos: ya aparecía mencionado (aunque no ratificado) en `ARCHITECTURE.md`; encaja con TypeScript + PostgreSQL; genera migraciones desde el schema; el Repository pattern ya definido en `packages/shared-domain` se implementa de forma natural sobre Prisma Client.

### Ubicación

`database/schema.prisma`, siguiendo el árbol de monorepo ya fijado en [ADR-000](../ADR-000_Estructura.md) (`database/` como carpeta de primer nivel). `apps/backend-api` referencia esta ruta en vez de tener su propio `prisma/schema.prisma` local, porque `database/` es explícitamente donde el árbol del monorepo espera este artefacto.

### Mapeo de entidades a tablas

| Entidad (ADR-004) | Tabla | Notas |
|---|---|---|
| `User` | `users` + `user_ratings` | `ratings: Map<AcademicLevel, Difficulty>` no es una columna — es una relación 1:N, una fila por nivel explorado |
| `Exercise` | `exercises` | `options` como `text[]` (nullable, solo `Test`) |
| `Session` | `sessions` | |
| `Answer` | `answers` | ver nota de desnormalización abajo |
| `Hint` | `hints` | `order` se mapea a la columna `hint_order` (`order` es palabra reservada en SQL) |

`Achievement` no se mapea — sigue sin materializar en el dominio (ADR-004), ningún UC lo usa.

### IDs: UUID

Todas las claves primarias son `UUID` (`@default(uuid())`), no enteros autoincrementales — no revelan recuento de filas y encajan con los IDs nominales (`UserId`, `ExerciseId`...) ya definidos como `string` en `packages/shared-domain/src/entities/ids.ts`.

### Índice crítico: selección de ejercicios (UC-008)

`ExerciseRepository.findByDifficultyBand({ academicLevel, topic, band })` ([ADR-004](ADR-004_domain.md), [UC-008](../use-cases/UC-008-select-next-exercise.md)) filtra por `academicLevel` + `topic` (igualdad) y `difficulty` (rango). Sin índice, esto sería un table scan en cada selección de ejercicio — el path más frecuente de todo el sistema. Se define:

```
@@index([academicLevel, topic, difficultyValue])
```

en `exercises` — igualdad en las dos primeras columnas, rango en la tercera es exactamente el patrón que un índice B-tree compuesto optimiza.

### Desnormalización deliberada: `answers.user_id`

`Answer` (ADR-004) solo tiene `sessionId`, no `userId` directo — `AnswerRepository.findByUserId` (UC-007, estadísticas) requeriría un `JOIN` con `sessions` en cada respuesta agregada. Dado que UC-007 agrega **todas** las respuestas de un usuario agrupadas por tema, y es una consulta explícitamente de solo lectura pensada para ejecutarse a demanda, se añade `user_id` directamente en `answers` (copiado de `session.userId` al crear la respuesta, inmutable después — no hay riesgo real de inconsistencia porque `Answer.sessionId` nunca cambia tras su creación). Se documenta como desviación deliberada del modelo de dominio (que no lo modela así a propósito, por Clean Architecture), no un error.

### Enums

`AcademicLevel` y `ExerciseType` se mapean a enums nativos de PostgreSQL vía Prisma. `generatedBy: 'ai-batch' | 'manual'` (ADR-004) usa `@map` porque un identificador de enum Prisma no admite guiones:

```prisma
enum GeneratedBy {
  AiBatch @map("ai-batch")
  Manual  @map("manual")
}
```

## Adenda (2026-08-07): UserCredentials, Session.topic/ratingAtStart, Exercise.timeLimitMs

Al abordar la implementación real de los `Prisma*Repository` (hasta ahora `declare class` sin cuerpo), la exploración previa detectó que el schema físico se había quedado desactualizado respecto al modelo de dominio que evolucionó durante la sesión: tres campos que ya existen en las entidades TypeScript de `packages/shared-domain` nunca se materializaron aquí. Implementar los repositorios contra el schema tal cual estaba habría perdido esos campos en cada `save()` — no un hueco de diseño, un bug de persistencia.

**Nuevo modelo `UserCredentials`** (`user_credentials`): este ADR (línea 33-34, versión original) dejó explícitamente las credenciales fuera de alcance "hasta que se implemente US-001/US-002". Esos dos casos de uso (UC-009 Register, UC-010 Login) ya están implementados — se añade `userId String @id`, `passwordHash String`, relación 1:1 con `User`, mismo criterio de separación deliberada del agregado `User` ya fijado en ADR-004.

**`Session.topic` y `Session.ratingAtStart`**: añadidos a la entidad de dominio al resolver huecos de UC-008 (continuidad de tema tras el primer ejercicio) y UC-006 (snapshot de rating al iniciar sesión) — ver `STATUS.md` #22 y #27 — pero nunca llegaron al schema físico.

**`Exercise.timeLimitMs`**: mismo caso — `Exercise.timer.limitMs` existe en el dominio desde UC-002/UC-004 (`STATUS.md` #20), sin columna equivalente hasta ahora.

Actualiza el mapeo de entidades a tablas de la sección "Decisión" (arriba): `User` pasa a mapear también a `user_credentials` (1:1), y `exercises`/`sessions` ganan las columnas anteriores. No cambia ninguna decisión ya tomada (ORM, ubicación, UUIDs, índice de `exercises`, desnormalización de `answers.user_id`) — solo completa el modelo con lo que el dominio ya había decidido en el camino.

## Consecuencias

### Positivas

- Desbloquea implementar `US-001` y el resto de flujos que tocan persistencia, sin comprometer todavía código de negocio (sigue siendo diseño).
- El índice de `exercises` está pensado desde el principio para el patrón de acceso real (UC-008), no añadido a posteriori tras un problema de rendimiento.
- Prisma genera migraciones a partir de este schema — no hay que escribirlas a mano.

### Negativas / Riesgos

- `answers.user_id` desnormalizado es redundante con `answers.session_id → sessions.user_id` — si en el futuro una `Answer` pudiera reasignarse a otra sesión (no previsto, no lo permite el dominio actual), quedaría inconsistente. Aceptado porque el dominio no permite esa operación.
- El `topic` de `exercises` sigue siendo `TemaCode` (string libre, [ADR-006](ADR-006_math_topics.md)), no una FK a una tabla de Temas — el catálogo de ADR-006 no está materializado como datos, solo como documento. Si se necesitara integridad referencial real, requeriría una tabla `temas` — fuera de alcance de este ADR.

## Fuera de alcance

- ~~Migraciones reales (`prisma migrate dev`)~~ y ~~implementaciones concretas de los repositorios (`PrismaUserRepository`, etc.)~~ — abordadas en la adenda 2026-08-07 de arriba, ya con Tests (ADR-003).
- Seed data / datos de prueba.
- Materializar el catálogo de Temas (ADR-006) como tabla `temas` con FK desde `exercises`.
- `docker-compose.yml` para levantar PostgreSQL/Redis local — sigue vacío, es tarea de DevOps Agent.

## Trazabilidad

Registrado en `.ai/prompts/architecture.md`.
