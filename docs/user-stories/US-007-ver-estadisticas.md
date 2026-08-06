# US-007: Ver Estadísticas

**Como** usuario registrado
**Quiero** ver mi historial y estadísticas de progreso
**Para** entender mi evolución y qué temas domino o necesito reforzar

> Sin caso de uso asignado todavía: UC-001 a UC-006 (STATUS.md) no cubren esta historia. Al definir Casos de Uso hace falta añadir un UC-007 (p. ej. `GetUserStatistics`).

## Contexto de dominio

Se apoya en `Answer` agregado por `code`/`area` de [ADR-006](../ADR/ADR-006_math_topics.md) para detectar fortalezas/debilidades por tema, y en `Score`/rating de `User` ([ADR-004](../ADR/ADR-004_domain.md), [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)) para la evolución general. El caso de uso de agregación en sí no está diseñado todavía (ver nota anterior).

## Criterios de Aceptación

```gherkin
Scenario: Ver estadísticas globales
  Given un usuario registrado con historial de sesiones
  When accede a su pantalla de estadísticas
  Then ve su score acumulado, nivel y rating actual

Scenario: Ver desglose por tema
  Given un usuario con respuestas registradas en varios temas
  When accede a su pantalla de estadísticas
  Then ve su rendimiento desglosado por área/tema
  And puede identificar en qué temas tiene mejor y peor desempeño

Scenario: Usuario sin historial
  Given un usuario registrado que nunca completó una sesión
  When accede a su pantalla de estadísticas
  Then ve un estado vacío indicando que aún no tiene datos, sin errores
```

## Fuera de alcance

- Diseño del caso de uso de agregación de estadísticas (UC-007) — pendiente al definir Casos de Uso.
- Comparativas entre usuarios (rankings, leaderboards) — no solicitado, no se asume.
