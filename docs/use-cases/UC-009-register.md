# UC-009: Register

`RegisterUseCase`

> Caso de uso nuevo, no listado en la versión original de STATUS.md ni en la primera pasada de Casos de Uso. Cierra el hueco detectado al construir el backend real: [US-001](../user-stories/US-001-registro.md) nunca tuvo Caso de Uso asignado (a diferencia de [US-007](../user-stories/US-007-ver-estadisticas.md), que sí lo obtuvo retroactivamente).

## Actor Principal

Visitante (usuario no registrado).

## Trigger

El visitante completa el formulario de registro ([US-001](../user-stories/US-001-registro.md)).

## Precondiciones

- Ninguna cuenta existente usa el email indicado.

## Flujo Principal

1. El sistema verifica que no exista ya un `User` con ese email.
2. Genera el hash de la contraseña (nunca se persiste en texto plano — [ADR-012](../ADR/ADR-012_linea_base_seguridad.md)).
3. Crea un `User` ([ADR-004](../ADR/ADR-004_domain.md)) con el `AcademicLevel` elegido y `ratings` sembrado con la semilla de ese nivel ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).
4. Persiste el `User` y, por separado, sus credenciales (el hash de contraseña no vive en la entidad `User` de dominio — decisión ya fijada en ADR-004: "las credenciales... quedan fuera de alcance, responsabilidad de backend-api").
5. Emite un token de sesión para el usuario recién creado.
6. Devuelve el `userId` y el token.

## Flujos Alternativos

- **1a. Email ya registrado**: el sistema rechaza el registro con un mensaje indicando que el email ya está en uso, ver [US-001](../user-stories/US-001-registro.md) escenario "Email ya registrado".

## Postcondiciones

`User` creado con rating inicial sembrado; el visitante queda autenticado (token de sesión emitido).

## Entidades involucradas

`User`, credenciales (fuera del agregado `User`, ver Flujo Principal paso 4).

## Referencias

- [ADR-004](../ADR/ADR-004_domain.md), [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md), [ADR-012](../ADR/ADR-012_linea_base_seguridad.md) (hash de contraseña, mensajes de error).
