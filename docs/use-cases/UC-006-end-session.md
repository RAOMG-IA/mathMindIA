# UC-006: End Session

`EndSessionUseCase`

## Actor Principal

Usuario.

## Trigger

El usuario decide finalizar su sesión de entrenamiento ([US-006](../user-stories/US-006-finalizar-sesion.md)).

## Precondiciones

- `Session` activa (no finalizada) perteneciente al usuario.

## Flujo Principal

1. El sistema marca `endedAt = ahora` en la `Session` ([ADR-004](../ADR/ADR-004_domain.md)).
2. Calcula el resumen: número de aciertos, número de intentos, tiempo medio de respuesta, variación de `userRating` desde el inicio de la sesión.
3. Devuelve el resumen al usuario.

## Flujos Alternativos

- **Sesión sin ejercicios respondidos**: el cálculo del resumen debe manejar el caso de cero intentos sin error, ver [US-006](../user-stories/US-006-finalizar-sesion.md).

## Postcondiciones

`Session.endedAt` fijado; la sesión no admite más `Answer`.

## Entidades involucradas

`Session`, `Answer` (agregados).

## Referencias

- [ADR-004](../ADR/ADR-004_domain.md).
