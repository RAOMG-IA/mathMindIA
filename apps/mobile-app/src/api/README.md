# API

Clientes TanStack Query que consumen `backend-api`, tipados con los DTOs de `packages/shared-types`.

**Patrón fijado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: un hook por ruta de [`apps/backend-api/openapi.yaml`](../../../backend-api/openapi.yaml) (contrato exacto), sobre un `fetchClient` base que añade `Authorization: Bearer <sessionToken>` salvo en `/auth/register`/`/auth/login`. El `sessionToken` se lee del store de sesión (Zustand, ver [src/store/README.md](../store/README.md)), hidratado desde `expo-secure-store`.

Pendiente de implementar — el bloqueo original (contratos DTO/API sin definir) ya no aplica.
