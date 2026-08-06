# Ports

Puertos de infraestructura genericos (no de persistencia — esos son `../repositories`) que necesitan los Casos de Uso: `IdGenerator`, `Clock`, `HintUsageTracker` (contador efimero de pistas por sesion+ejercicio, ver UC-003). Mismo patron ports-and-adapters que los repositorios: interfaz minima aqui, implementacion real en `apps/backend-api/src/infrastructure` y fake deterministico en `packages/shared-testing/src/mocks` para tests.
