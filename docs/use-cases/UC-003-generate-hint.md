# UC-003: Generate Hint

`GenerateHintUseCase`

## Actor Principal

Usuario (vía `backend-api`, que a su vez invoca `ai-engine`).

## Trigger

El usuario solicita una pista tras agotar el tiempo en Modo Resolución ([US-005](../user-stories/US-005-solicitar-pista.md)).

## Precondiciones

- `Session` activa en `ExerciseType.Resolution`.
- El ejercicio actual agotó su tiempo límite sin respuesta correcta.

## Flujo Principal

1. El sistema verifica que el ejercicio es de tipo `Resolution` y que el tiempo expiró.
2. Determina el `order` de la siguiente pista (número de pistas ya usadas en el intento + 1).
3. Si ya existe un `Hint` con ese `order` para el ejercicio, lo devuelve (reutiliza contenido ya generado).
4. Si no existe, invoca a `ai-engine` (Qwen) para generar una pista de ese nivel de progresión y la persiste como `Hint` ([ADR-004](../ADR/ADR-004_domain.md)).
5. Incrementa `hintsUsed` en el intento en curso.
6. Devuelve la pista al usuario.

## Flujos Alternativos

- **1a. Modo Test**: el ejercicio es de tipo `Test` → se rechaza la solicitud, ver [US-005](../user-stories/US-005-solicitar-pista.md) escenario "Modo Test no ofrece pistas".

## Postcondiciones

`Hint` disponible y devuelta al usuario; `hintsUsed` incrementado.

## Entidades involucradas

`Hint`, `Exercise`, `Answer` (intento en curso).

## Referencias

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — "Uso Permitido de IA: Generar pistas".
