# shared-testing

Builders, Fixtures, Mocks, Factories (ver [ARCHITECTURE.md](../../ARCHITECTURE.md)).

## Regla de dependencia (evitar ciclo)

Este paquete depende de `@mathmind/shared-domain` y `@mathmind/shared-types` para producir fixtures tipados. Por eso **`shared-domain` y `shared-types` no deben añadir `shared-testing` como dependencia** — crearía un ciclo en el grafo de workspaces que Turborepo rechazaría al construir el orden de `build`. Si `shared-domain` necesita datos de prueba para sus propios tests, debe construirlos localmente (objetos planos), no importando este paquete.

Consumido por `apps/backend-api`, `apps/ai-engine`, `apps/mobile-app` y `packages/shared-utils` en sus tests — ninguno de ellos es una dependencia de este paquete, así que no hay riesgo de ciclo ahí.
