# DTOs

Contratos de intercambio entre `mobile-app` y `backend-api`, derivados directamente de los Casos de Uso ([docs/use-cases](../../../../docs/use-cases/)) y User Stories ([docs/user-stories](../../../../docs/user-stories/)):

- [`Auth.ts`](Auth.ts) — US-001 Registro, US-002 Login.
- [`User.ts`](User.ts) — perfil básico.
- [`Session.ts`](Session.ts) — UC-005 Start Session, UC-006 End Session.
- [`Exercise.ts`](Exercise.ts) — `ExercisePublicDto`, forma segura para el cliente (sin `correctAnswer` ni `explanation` antes de responder).
- [`Answer.ts`](Answer.ts) — UC-002 Validate Answer (incluye el siguiente ejercicio, UC-008, en la misma respuesta).
- [`Hint.ts`](Hint.ts) — UC-003 Generate Hint.
- [`Statistics.ts`](Statistics.ts) — UC-007 Get User Statistics.

El mecanismo de transporte del token de sesión (header `Authorization` vs. cookie) no está decidido — los DTOs no lo modelan, solo los payloads de solicitud/respuesta.
