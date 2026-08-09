# API

Clientes TanStack Query que consumen `backend-api`, tipados con los DTOs de `packages/shared-types`.

**Patrón fijado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: un hook por ruta de [`apps/backend-api/openapi.yaml`](../../../backend-api/openapi.yaml) (contrato exacto), sobre un `fetchClient` base que añade `Authorization: Bearer <sessionToken>` salvo en `/auth/register`/`/auth/login`. El `sessionToken` se lee del store de sesión (Zustand, ver [src/store/README.md](../store/README.md)).

`fetchClient` implementado (TDD Red→Green, 4/4 tests — `fetchClient.test.ts`), base URL vía `EXPO_PUBLIC_API_BASE_URL` (`.env.example`).

**7 rutas de negocio implementadas** (de las 8 de `openapi.yaml` — `/health` no tiene consumidor en ninguna pantalla, omitida deliberadamente):

- `requests/` — funciones puras `*Request(dto)` que envuelven `fetchClient` una por ruta (`auth.ts` → `/auth/register`+`/auth/login`, `session.ts` → `/sessions`+`/sessions/end`, `answer.ts` → `/answers`, `hint.ts` → `/hints`, `statistics.ts` → `/users/me/statistics`). TDD Red→Green, 7/7 tests — verifican método, ruta y body serializado, sin duplicar la cobertura de `fetchClient.test.ts`.
- `hooks/` — un hook de TanStack Query por función de `requests/` (`useAuth.ts`, `useSession.ts`, `useAnswer.ts`, `useHint.ts`, `useStatistics.ts`). Wiring puro sobre `useMutation`/`useQuery`, sin test automático (requeriría `QueryClientProvider`+`renderHook`, tooling no presente en el monorepo) — mismo criterio que `routes.ts`/`main.ts` en `backend-api`. `useRegister`/`useLogin` escriben la sesión en `useSessionStore` en `onSuccess` (el email se toma de la propia petición, no de la respuesta — ver `src/store/README.md`). `useUserStatistics` usa una `queryKey` compartida (`queryKeys.ts`) para que el header global y `(app)/statistics` (ADR-015) reutilicen la misma caché en vez de pedir el dato dos veces.
