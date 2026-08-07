# Presentation / HTTP

Controllers REST (`AuthController`, `SessionController`, `AnswerController`, `HintController`, `StatisticsController`) — implementados y testeados (TDD Red→Green), traducen DTOs (`packages/shared-types`) a llamadas de Casos de Uso reales. No conocen Express directamente.

`routes.ts` mapea rutas → Controller, siguiendo el mapa de [ARCHITECTURE.md](../../../../../ARCHITECTURE.md) ("API REST (Rutas)"). `middleware/authMiddleware.ts` resuelve `Authorization: Bearer <sessionToken>` a un `userId` inyectado en `req.userId` — testeado (`extractBearerToken` + `createAuthMiddleware` con objetos Request/Response mínimos, sin servidor real). El wiring en sí (`routes.ts`, `../main.ts`) queda sin tests automáticos — necesitaría un servidor HTTP real o `supertest` (no incorporado en este alcance); se verificó manualmente arrancando el servidor y probando el flujo completo (registro → login → iniciar sesión → responder → finalizar sesión → estadísticas) contra `curl`.
