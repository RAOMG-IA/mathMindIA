# US-004: Resolver Ejercicio

**Como** usuario en una sesión de entrenamiento activa
**Quiero** recibir un ejercicio acorde a mi nivel y responderlo dentro del tiempo límite
**Para** practicar cálculo mental con dificultad ajustada a mi rendimiento

## Contexto de dominio

Cubre UC-001 (Generate Exercise), UC-002 (Validate Answer) y UC-004 (Update Difficulty). Cada respuesta crea un `Answer` ([ADR-004](../ADR/ADR-004_domain.md)) y dispara el Adaptive Difficulty Engine ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)), que determina la dificultad del siguiente ejercicio.

## Criterios de Aceptación

```gherkin
Scenario: Responder correctamente en Modo Test
  Given una sesión activa en Modo Test con un ejercicio mostrado
  When el usuario selecciona la opción correcta dentro del tiempo límite
  Then el sistema marca la respuesta como correcta
  And muestra la explicación de la solución
  And el siguiente ejercicio refleja la nueva dificultad calculada

Scenario: Responder correctamente en Modo Resolución
  Given una sesión activa en Modo Resolución con un ejercicio mostrado
  When el usuario introduce el valor correcto dentro del tiempo límite
  Then el sistema marca la respuesta como correcta
  And muestra la explicación paso a paso

Scenario: Responder incorrectamente
  Given una sesión activa con un ejercicio mostrado
  When el usuario responde de forma incorrecta
  Then el sistema marca la respuesta como incorrecta
  And la racha de aciertos se resetea a cero
  And muestra la explicación de la solución correcta

Scenario: Se agota el tiempo sin responder
  Given una sesión activa con un ejercicio mostrado y un límite de tiempo configurado
  When el tiempo se agota sin que el usuario responda
  Then el sistema registra el intento como incorrecto
  And la racha de aciertos se resetea a cero
  And muestra la explicación de la solución correcta

Scenario: Nota de cálculo mental en Modo Test
  Given una sesión activa en Modo Test con un ejercicio mostrado
  When el usuario ve el ejercicio
  Then el sistema muestra una nota orientativa sobre técnicas de cálculo mental
  And esa nota no depende del enunciado del ejercicio ni se genera por IA
```

## Fuera de alcance

- Fórmulas exactas de actualización de dificultad — ya definidas en [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md), no se repiten aquí.
- Sistema de pistas — cubierto por [US-005](US-005-solicitar-pista.md). La nota de cálculo mental de Modo Test tampoco es una pista (US-005 sigue reservando pistas a Modo Resolución) — es contenido genérico y constante, no progresivo ni ligado al ejercicio.
