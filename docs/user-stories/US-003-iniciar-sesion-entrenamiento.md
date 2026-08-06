# US-003: Iniciar Sesión de Entrenamiento

**Como** usuario autenticado
**Quiero** iniciar una sesión de entrenamiento eligiendo modo, nivel académico y tema
**Para** empezar a resolver ejercicios ajustados a lo que quiero practicar

## Contexto de dominio

Corresponde a UC-005 (Start Session) y crea una `Session` ([ADR-004](../ADR/ADR-004_domain.md)) con `mode` (`Test` o `Resolution`) fijo para toda su duración. El tema elegido debe existir en el catálogo de [ADR-006](../ADR/ADR-006_math_topics.md).

## Criterios de Aceptación

```gherkin
Scenario: Iniciar sesión en Modo Test
  Given un usuario autenticado en la pantalla de inicio
  When elige Modo Test, un nivel académico y un tema
  And confirma
  Then se crea una sesión de entrenamiento en Modo Test
  And recibe el primer ejercicio de opción múltiple (3 respuestas)

Scenario: Iniciar sesión en Modo Resolución
  Given un usuario autenticado en la pantalla de inicio
  When elige Modo Resolución, un nivel académico y un tema
  And confirma
  Then se crea una sesión de entrenamiento en Modo Resolución
  And recibe el primer ejercicio de respuesta libre

Scenario: Nivel académico por defecto
  Given un usuario autenticado cuyo nivel académico de perfil es Secundaria
  When abre la pantalla de inicio de sesión de entrenamiento
  Then el nivel académico aparece preseleccionado como Secundaria
  And puede cambiarlo a otro nivel antes de confirmar

Scenario: Tema inexistente
  Given un usuario iniciando una sesión de entrenamiento
  When intenta seleccionar un tema que no existe en el catálogo
  Then el sistema no permite continuar
```

## Fuera de alcance

- Selección de varios temas combinados en una misma sesión — se asume un tema por sesión en esta historia.
- Recomendación automática de tema/nivel — es materia de itinerarios adaptativos (fuera de alcance también en [ADR-006](../ADR/ADR-006_math_topics.md)).
