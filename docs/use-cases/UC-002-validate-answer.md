# UC-002: Validate Answer

`ValidateAnswerUseCase`

## Actor Principal

Usuario (vía `backend-api`).

## Trigger

El usuario envía una respuesta a un ejercicio mostrado ([US-004](../user-stories/US-004-resolver-ejercicio.md)).

## Precondiciones

- Existe una `Session` activa (no finalizada).
- Hay un `Exercise` pendiente de respuesta en esa sesión.

## Flujo Principal

1. El sistema recibe la respuesta enviada y el tiempo transcurrido.
2. Compara la respuesta con `Exercise.correctAnswer`.
3. Crea un `Answer` ([ADR-004](../ADR/ADR-004_domain.md)) con `isCorrect`, `responseTimeMs`, `hintsUsed`.
4. Actualiza `currentStreak` del usuario: se incrementa si la respuesta es correcta, se resetea a 0 si es incorrecta.
5. Invoca [UC-004 Update Difficulty](UC-004-update-difficulty.md) con el resultado del intento.
6. Devuelve al usuario si acertó o no, y la explicación del ejercicio.

## Flujos Alternativos

- **1a. Tiempo agotado**: se agota el tiempo límite sin que el usuario responda → se trata como intento incorrecto automático (continúa desde el paso 3 con `isCorrect = false`), ver [US-004](../user-stories/US-004-resolver-ejercicio.md) escenario "se agota el tiempo".

## Postcondiciones

`Answer` persistido; `currentStreak` y rating del usuario actualizados (vía UC-004).

## Entidades involucradas

`Answer`, `Exercise`, `User` ([ADR-004](../ADR/ADR-004_domain.md)).

## Referencias

- [ADR-004](../ADR/ADR-004_domain.md), [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md).
