# US-002: Login

**Como** usuario registrado
**Quiero** iniciar sesión con mis credenciales
**Para** acceder a mi progreso y continuar entrenando donde lo dejé

> No confundir con [US-003](US-003-iniciar-sesion-entrenamiento.md) "Iniciar Sesión de Entrenamiento": esta historia es autenticación, no el arranque de una `Session` de práctica.

## Criterios de Aceptación

```gherkin
Scenario: Login exitoso
  Given un usuario registrado con credenciales válidas
  When introduce su email y contraseña correctos
  Then queda autenticado
  And accede a su perfil (nivel académico, rating, score)

Scenario: Credenciales incorrectas
  Given un usuario registrado
  When introduce un email o contraseña incorrectos
  Then el sistema rechaza el acceso
  And muestra un mensaje de error genérico, sin indicar cuál de los dos datos falló

Scenario: Sesión persistente
  Given un usuario que ya inició sesión previamente
  When vuelve a abrir la aplicación dentro del periodo de validez de su sesión
  Then no se le vuelve a pedir login
```

## Fuera de alcance

- Mecanismo concreto de autenticación (JWT, sesiones de servidor, OAuth) — decisión técnica del Architecture/Security Agent, no de esta historia.
- Recuperación de contraseña.
