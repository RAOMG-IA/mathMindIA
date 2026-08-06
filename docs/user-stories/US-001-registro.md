# US-001: Registro

**Como** visitante (usuario no registrado)
**Quiero** crear una cuenta indicando mi nivel académico
**Para** guardar mi progreso y que los ejercicios se ajusten a mi nivel desde el principio

## Contexto de dominio

Al registrarse se crea un `User` ([ADR-004](../ADR/ADR-004_domain.md)) con el `AcademicLevel` elegido. Su `userRating` se inicializa con la semilla de ese nivel ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).

## Criterios de Aceptación

```gherkin
Scenario: Registro exitoso
  Given un visitante en la pantalla de registro
  When introduce email, contraseña y selecciona su nivel académico
  And confirma el registro
  Then se crea una cuenta con ese nivel académico
  And el visitante queda autenticado
  And su rating inicial corresponde a la semilla de ese nivel

Scenario: Email ya registrado
  Given un email que ya pertenece a una cuenta existente
  When un visitante intenta registrarse con ese email
  Then el sistema rechaza el registro
  And muestra un mensaje indicando que el email ya está en uso

Scenario: Nivel académico obligatorio
  Given un visitante rellenando el formulario de registro
  When intenta enviarlo sin seleccionar un nivel académico
  Then el sistema no permite continuar
  And solicita seleccionar un nivel antes de continuar
```

## Fuera de alcance

- Verificación de email, recuperación de contraseña, login social — no forman parte de esta historia.
- Diseño de la política de contraseñas — se define al implementar (Security Agent, [ADR-002](../ADR-002_Agentes.md)), no aquí.
