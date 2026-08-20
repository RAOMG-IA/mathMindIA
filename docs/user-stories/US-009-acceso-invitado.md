# US-009: Acceso rápido sin registro ("Prueba sin registrarte")

**Como** tutor/revisor del TFM (o cualquier visitante)
**Quiero** entrar a la app con un solo clic, sin rellenar ningún formulario
**Para** poder evaluar la aplicación sin la fricción de crear una cuenta

## Contexto de dominio

Bajo el capó sigue siendo un `User` real ([ADR-004](../ADR/ADR-004_domain.md)), creado por el mismo mecanismo que [US-001](US-001-registro.md) (Registro) — mismo caso de uso de alta, mismo `AcademicLevel`, misma semilla de rating ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)). No es un "modo sin cuenta": es un alta automática con datos generados por el sistema en vez de tecleados por la persona.

- **`username` visible**: `Publico` + un número aleatorio, para poder distinguir varias personas usando el acceso de invitado a la vez.
- **`email`** (identidad real del `User`, US-001): derivado del mismo nombre generado, sobre un dominio sintético reservado para invitados (p. ej. `publico<n>@invitado.mathmind.local`) — para no colisionar nunca con un email real ni depender de que la persona aporte uno.
- **`password`**: derivada de la IP de origen vista por el servidor al recibir la petición (`req.ip` en `backend-api`), no algo que el propio navegador calcule — evita depender de un servicio externo de terceros solo para que el cliente "sepa su propia IP" ([ADR-012](../ADR/ADR-012_linea_base_seguridad.md), minimizar dependencias externas nuevas sin necesidad real). **Resuelto al implementar (2026-08-20)**: no es la IP tal cual — muchas IPs reales no llegan a los 8 caracteres mínimos de la política de contraseñas (`8.8.8.8` = 7, `::1` = 3), así que el password real es `guest-<ip>-<mismo número del email>`, que sigue derivando de la IP sin reinterpretar el requisito. **No es un mecanismo de seguridad real**: varias personas en la misma red comparten IP pública, así que no distingue a nadie por sí sola — quien realmente evita colisiones es el número aleatorio del `username`. La protección de una cuenta 'Publico' no es la contraseña, es que no guarda nada que a nadie le interese usurpar; se documenta como decisión aceptada, no como control de seguridad real.
- **`academicLevel`**: fijo a `Secundaria` (nivel intermedio), sin selector — decisión de producto para que el flujo sea de un único clic, sin pasos intermedios.

## Criterios de Aceptación

```gherkin
Scenario: Acceso de invitado exitoso
  Given un visitante en la pantalla de login
  When pulsa "Prueba sin registrarte"
  Then el sistema crea una cuenta con usuario "Publico<número aleatorio>" y nivel académico Secundaria
  And el visitante queda autenticado de inmediato, sin pasos intermedios
  And accede a Home igual que cualquier usuario recién registrado

Scenario: Colisión de nombre generado
  Given que ya existe una cuenta "Publico<número>" con ese número exacto
  When el sistema genera ese mismo número aleatorio para un nuevo invitado
  Then el sistema reintenta automáticamente con otro número
  And el visitante no ve ningún error ni percibe el reintento

Scenario: Varios invitados a la vez desde la misma red
  Given dos personas distintas pulsando "Prueba sin registrarte" en paralelo desde la misma IP pública (p. ej. misma institución)
  When ambas completan el acceso
  Then cada una obtiene una cuenta "Publico<número>" distinta con su propia sesión
  And no comparten progreso, rating ni estadísticas entre sí

Scenario: Repetir el acceso de invitado
  Given un visitante que ya usó "Prueba sin registrarte" antes
  When vuelve a pulsar el botón (nueva pestaña, recarga, o tras cerrar sesión)
  Then se crea una cuenta "Publico<número>" nueva, distinta de la anterior
  And el progreso de la cuenta anterior no es accesible desde la cuenta nueva
```

## Fuera de alcance

- Reutilizar o recuperar una cuenta de invitado ya creada en el mismo navegador — cada acceso crea una cuenta nueva (ver Criterios de Aceptación, "Repetir el acceso de invitado"); confirmado con el usuario.
- Distinguir visualmente una cuenta 'Publico' de una cuenta registrada normal (badge, etiqueta, restricción de funciones) — no se ha pedido, la cuenta se comporta como cualquier otra una vez creada.
- Expiración, borrado periódico o límite de cuentas 'Publico' — no forma parte de esta historia.
- Desactivar esta funcionalidad tras la entrega del TFM — confirmado con el usuario que es una vía de acceso permanente del producto, no algo temporal.
- ~~**Mecanismo concreto en el servidor** (reutilizar `POST /auth/register` con datos autogenerados en el cliente, o un endpoint dedicado tipo `POST /auth/guest`) — decisión de Architecture, no de esta historia.~~ ✅ **Resuelto (2026-08-20)**: nuevo `POST /auth/guest`, sin request body — no literalmente el mismo endpoint HTTP que pidió el usuario, pero sí la misma lógica de negocio: `GuestLoginUseCase` compone e invoca `RegisterUseCase` tal cual, sin duplicar altas de usuario. Motivo del endpoint nuevo en vez de reusar `/auth/register` sin cambios: el password debe derivarse de la IP que ve el **servidor** (`req.ip`), y `AuthController` es deliberadamente agnóstico de Express (nunca toca `Request`) — la única forma de mantener esa separación es que `routes.ts` extraiga la IP y la pase a un método nuevo, no que el cliente intente calcular "su propia IP" (exigiría depender de un servicio externo de terceros solo para eso, ver `ADR-012`). Ver `apps/backend-api/src/application/use-cases/GuestLoginUseCase.ts` y `openapi.yaml` (`/auth/guest`).
