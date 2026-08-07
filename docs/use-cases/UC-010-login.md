# UC-010: Login

`LoginUseCase`

> Caso de uso nuevo, mismo motivo que [UC-009](UC-009-register.md): cierra el hueco de [US-002](../user-stories/US-002-login.md), que tampoco tenía Caso de Uso asignado.

## Actor Principal

Usuario registrado.

## Trigger

El usuario introduce sus credenciales ([US-002](../user-stories/US-002-login.md)).

## Precondiciones

- Existe un `User` con el email indicado.

## Flujo Principal

1. El sistema busca al `User` por email.
2. Verifica la contraseña contra el hash almacenado.
3. Emite un token de sesión.
4. Devuelve el `userId` y el token.

## Flujos Alternativos

- **1a/2a. Credenciales incorrectas**: email inexistente o contraseña incorrecta → el sistema rechaza el acceso con el **mismo** mensaje de error genérico en ambos casos, sin indicar cuál de los dos datos falló ([US-002](../user-stories/US-002-login.md) escenario "Credenciales incorrectas", [ADR-012](../ADR/ADR-012_linea_base_seguridad.md)). Evita que un atacante deduzca qué emails están registrados por diferencia de respuesta.

## Postcondiciones

Usuario autenticado (token de sesión emitido).

## Entidades involucradas

`User`, credenciales (ver [UC-009](UC-009-register.md)).

## Referencias

- [ADR-012](../ADR/ADR-012_linea_base_seguridad.md) (mensajes de error genéricos, hash de contraseña).
