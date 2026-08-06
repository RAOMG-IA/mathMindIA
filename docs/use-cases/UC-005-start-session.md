# UC-005: Start Session

`StartSessionUseCase`

## Actor Principal

Usuario.

## Trigger

El usuario inicia una sesión de entrenamiento eligiendo modo, nivel académico y tema ([US-003](../user-stories/US-003-iniciar-sesion-entrenamiento.md)).

## Precondiciones

- Usuario autenticado ([US-002](../user-stories/US-002-login.md)).
- Tema y `AcademicLevel` elegidos son válidos según el catálogo ([ADR-006](../ADR/ADR-006_math_topics.md)).

## Flujo Principal

1. El sistema valida que el Tema exista en el catálogo para el `AcademicLevel` elegido.
2. Crea una `Session` ([ADR-004](../ADR/ADR-004_domain.md)) con `mode`, `academicLevel`, `userId`, `startedAt = ahora`.
3. Invoca [UC-008 Select Next Exercise](UC-008-select-next-exercise.md) para obtener el primer ejercicio.
4. Devuelve la sesión creada y el primer ejercicio.

## Flujos Alternativos

- **1a. Tema no válido**: el Tema no existe o no aplica al `AcademicLevel` elegido → error, ver [US-003](../user-stories/US-003-iniciar-sesion-entrenamiento.md) escenario "Tema inexistente".

## Postcondiciones

`Session` activa creada, con su primer `Exercise` ya seleccionado.

## Entidades involucradas

`Session`, `User`.

## Referencias

- [ADR-004](../ADR/ADR-004_domain.md), [ADR-006](../ADR/ADR-006_math_topics.md).
