# Mocks

Implementaciones en memoria de los contratos de repositorio y de los puertos de `packages/shared-domain`, para tests de Casos de Uso sin infraestructura real:

- `InMemorySessionRepository`, `InMemoryExerciseRepository`, `InMemoryAnswerRepository`, `InMemoryUserRepository`, `InMemoryHintRepository`, `InMemoryTemaRepository` (catalogo de referencia, se precarga en el constructor, sin `save`)
- `FixedClock`, `SequentialIdGenerator`, `InMemoryHintUsageTracker` (fakes deterministicos de `Clock`/`IdGenerator`/`HintUsageTracker`)
