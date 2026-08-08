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
4. Si no existe, recupera material de referencia relevante (si existe) de la base de conocimiento, construyendo la query a partir del `topic` y el `statement` del ejercicio ([UC-011](UC-011-ingest-knowledge-base.md), [ADR-014](../ADR/ADR-014_rag.md)).
5. Invoca a `ai-engine` (Qwen) para generar una pista de ese nivel de progresión, apoyada en el material recuperado si lo hay, y la persiste como `Hint` ([ADR-004](../ADR/ADR-004_domain.md)).
6. Incrementa `hintsUsed` en el intento en curso.
7. Devuelve la pista al usuario.

## Flujos Alternativos

- **1a. Modo Test**: el ejercicio es de tipo `Test` → se rechaza la solicitud, ver [US-005](../user-stories/US-005-solicitar-pista.md) escenario "Modo Test no ofrece pistas".
- **4a. Sin material de referencia disponible**: la recuperación no devuelve resultados (Tema sin material consolidado todavía, [US-008](../user-stories/US-008-subir-material-rag.md)) → la pista se genera igual que hoy, sin contexto adicional, sin fallar.

## Postcondiciones

`Hint` disponible y devuelta al usuario; `hintsUsed` incrementado.

## Entidades involucradas

`Hint`, `Exercise`, `Answer` (intento en curso), puerto `KnowledgeBaseIndex` ([ADR-014](../ADR/ADR-014_rag.md)).

## Referencias

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — "Uso Permitido de IA: Generar pistas".
- [ADR-014](../ADR/ADR-014_rag.md) — retrieval del material consolidado por [UC-011](UC-011-ingest-knowledge-base.md).
