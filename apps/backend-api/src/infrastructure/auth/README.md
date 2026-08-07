# Infrastructure / Auth

Implementaciones reales de los puertos de autenticación (`packages/shared-domain/src/ports`):

- **`BcryptPasswordHasher`** — `PasswordHasher` (ADR-012: "hash con algoritmo estándar bcrypt o argon2"). Testeado con la librería real (`bcrypt`, computo puro, sin red).
- **`JwtTokenIssuer`** — `TokenIssuer` (ADR-012 ya anticipa JWT por nombre). El secreto de firma se inyecta por constructor desde `JWT_SECRET` (variable de entorno, nunca hardcodeado). Testeado con la librería real (`jsonwebtoken`).

A diferencia de `../ai/QwenHintGenerator.ts` → `LangChainQwenModel` o de los futuros `Prisma*Repository`, ninguno de los dos depende de red ni base de datos — por eso sí tienen cobertura de test completa, sin gaps aceptados.
