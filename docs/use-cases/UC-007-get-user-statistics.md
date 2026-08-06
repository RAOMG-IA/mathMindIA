# UC-007: Get User Statistics

`GetUserStatisticsUseCase`

> Caso de uso nuevo, no listado en la versión original de STATUS.md. Se añade para cerrar el hueco detectado en [US-007](../user-stories/US-007-ver-estadisticas.md), que no tenía caso de uso asignado.

## Actor Principal

Usuario.

## Trigger

El usuario accede a su pantalla de estadísticas ([US-007](../user-stories/US-007-ver-estadisticas.md)).

## Precondiciones

- Usuario autenticado.

## Flujo Principal

1. El sistema recopila `Score` y rating actuales del usuario ([ADR-004](../ADR/ADR-004_domain.md), [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).
2. Agrega los `Answer` del usuario agrupados por `code`/`area` de Tema ([ADR-006](../ADR/ADR-006_math_topics.md)) para calcular precisión y tiempo medio de respuesta por tema.
3. Identifica fortalezas (temas con mayor precisión) y debilidades (temas con menor precisión), exigiendo un mínimo de intentos por tema antes de reportarlo, para evitar conclusiones con muestras insignificantes (p. ej. un solo intento).
4. Devuelve el resumen global más el desglose por tema.

## Flujos Alternativos

- **2a. Usuario sin historial**: no hay `Answer` registrados → se devuelve un resumen vacío, sin error, ver [US-007](../user-stories/US-007-ver-estadisticas.md) escenario "Usuario sin historial".

## Postcondiciones

Ninguna — operación de solo lectura.

## Entidades involucradas

`User`, `Answer`, `Exercise` (para resolver el Tema de cada respuesta), `Session`.

## Referencias

- [ADR-006](../ADR/ADR-006_math_topics.md) — agregación por `code`/`area` ya prevista como uno de los propósitos de la taxonomía.

## Fuera de alcance

- Umbral exacto de "mínimo de intentos por tema" — se define al implementar.
- Comparativas entre usuarios (rankings) — no solicitadas.
