# US-006: Finalizar Sesión

**Como** usuario en una sesión de entrenamiento activa
**Quiero** finalizar la sesión cuando decida parar
**Para** guardar mi progreso y ver un resumen de mi rendimiento

## Contexto de dominio

Cubre UC-006 (End Session). Marca `endedAt` en la `Session` ([ADR-004](../ADR/ADR-004_domain.md)); a partir de ahí no admite más `Answer`.

## Criterios de Aceptación

```gherkin
Scenario: Finalización manual
  Given una sesión de entrenamiento activa
  When el usuario decide finalizarla
  Then la sesión queda marcada como finalizada
  And se muestra un resumen con aciertos, tiempo medio de respuesta y variación de rating

Scenario: Sesión sin ejercicios respondidos
  Given una sesión recién iniciada sin ningún ejercicio respondido
  When el usuario la finaliza inmediatamente
  Then se muestra un resumen indicando que no hubo intentos, sin errores

Scenario: No se admiten respuestas tras finalizar
  Given una sesión ya finalizada
  When se intenta enviar una respuesta a un ejercicio de esa sesión
  Then el sistema la rechaza
```

## Fuera de alcance

- Finalización automática por inactividad — no está definida en esta historia; se podría añadir como historia separada si se detecta necesidad real.
