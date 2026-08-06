# US-005: Solicitar Pista

**Como** usuario en una sesión de entrenamiento activa en Modo Resolución
**Quiero** recibir una pista orientativa en vez de la solución directa
**Para** reforzar mi razonamiento matemático sin perder la oportunidad de resolver el ejercicio por mí mismo

## Contexto de dominio

Cubre UC-003 (Generate Hint). Cada pista es un `Hint` ([ADR-004](../ADR/ADR-004_domain.md)) con un `order` progresivo, generado por IA ("Uso Permitido de IA: Generar pistas", [ARCHITECTURE.md](../../ARCHITECTURE.md)). Solo aplica a `ExerciseType.Resolution`.

## Criterios de Aceptación

```gherkin
Scenario: Pista disponible tras agotar el tiempo
  Given una sesión activa en Modo Resolución con un ejercicio sin responder
  When se agota el tiempo límite del ejercicio
  Then el sistema ofrece una pista orientativa
  And no muestra la solución completa

Scenario: Pistas progresivas
  Given un usuario que ya recibió una primera pista y sigue sin resolver el ejercicio
  When solicita otra pista
  Then recibe una pista adicional más detallada que la anterior
  And el número de pistas usadas queda registrado en su intento

Scenario: Modo Test no ofrece pistas
  Given una sesión activa en Modo Test
  When se agota el tiempo de un ejercicio
  Then el sistema no ofrece ninguna pista
  And muestra directamente la explicación de la solución
```

## Fuera de alcance

- Número máximo de pistas por ejercicio — se define al implementar, no es parte de esta historia.
- Contenido/calidad de las pistas generadas por IA — responsabilidad del `ai-engine`, fuera del alcance de una historia de producto.
