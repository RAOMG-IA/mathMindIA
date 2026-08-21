# US-010: Cerrar sesión

**Como** usuario autenticado
**Quiero** poder cerrar mi sesión, tanto de forma manual como automática si dejo de usar la app
**Para** proteger mi cuenta cuando termino de usarla o cuando la abandono sin darme cuenta (p. ej. dispositivo compartido)

> No confundir con [US-006](US-006-finalizar-sesion.md) "Finalizar Sesión": esa historia termina una `Session` de entrenamiento (entidad de [ADR-004](../ADR/ADR-004_domain.md)), no la autenticación. Esta historia es la contraparte de cierre de [US-002](US-002-login.md) (Login): cerrar sesión aquí significa terminar la sesión autenticada, sin relación con si hay o no una `Session` de entrenamiento en curso en ese momento.

## Contexto de dominio

Dos disparadores distintos para el mismo resultado:

- **Manual**: el usuario pulsa un botón "Cerrar sesión", visible desde cualquier pantalla autenticada.
- **Automático por inactividad**: si el usuario no interactúa con la app durante **15 minutos**, el sistema cierra la sesión por su cuenta, sin que lo haya pedido.

En ambos casos el resultado visible es el mismo: la app vuelve a la pantalla de login ([US-002](US-002-login.md)) y hay que volver a autenticarse (o volver a usar "Prueba sin registrarte", [US-009](US-009-acceso-invitado.md), que como ya documenta esa historia crea una cuenta nueva cada vez — cerrar sesión en una cuenta de invitado no es distinto de cerrarla en una cuenta registrada).

El cierre automático por inactividad avisa antes de ejecutarse: al acercarse el límite de los 15 minutos, el sistema muestra un aviso con opción de continuar la sesión. Si el usuario no responde, la sesión se cierra igualmente cuando se cumple el plazo.

Esto es independiente de la validez del propio token de sesión en el servidor (actualmente 7 días, `JwtTokenIssuer`) — el cierre por inactividad es una decisión de producto sobre el *uso* de la app, no sobre cuánto dura el token emitido.

## Criterios de Aceptación

```gherkin
Scenario: Cierre de sesión manual
  Given un usuario autenticado en cualquier pantalla de la app
  When pulsa el botón "Cerrar sesión"
  Then su sesión termina de inmediato
  And la app le lleva a la pantalla de login
  And si vuelve atrás o recarga, sigue sin estar autenticado

Scenario: Aviso antes del cierre automático por inactividad
  Given un usuario autenticado que no interactúa con la app
  When se acerca al límite de 15 minutos de inactividad
  Then el sistema le muestra un aviso ofreciendo continuar la sesión
  And si el usuario responde al aviso, la sesión se mantiene activa y el contador de inactividad se reinicia

Scenario: Cierre automático por inactividad sin respuesta
  Given un usuario autenticado que no interactúa con la app
  When se cumplen los 15 minutos de inactividad sin que responda al aviso
  Then su sesión termina automáticamente
  And la app le lleva a la pantalla de login

Scenario: Actividad durante una sesión de entrenamiento no cuenta como inactividad
  Given un usuario con una Session de entrenamiento activa (US-003/US-004/US-005)
  When resuelve ejercicios o pide pistas dentro del tiempo de inactividad configurado
  Then el contador de inactividad se reinicia con cada interacción
  And no se le cierra la sesión mientras siga entrenando activamente
```

## Fuera de alcance

- **Mecanismo concreto de detección de inactividad y del aviso previo** (qué eventos cuentan como actividad, implementación del temporizador, diseño del aviso) — decisión de Architecture, no de esta historia.
- **Invalidación del token en servidor**: cerrar sesión aquí es una acción del cliente (se descarta la sesión localmente); si el token JWT emitido debe además revocarse en el servidor antes de su expiración natural de 7 días es una decisión técnica de Architecture/Security, no de esta historia.
- Cerrar sesión en todos los dispositivos a la vez (single logout / multi-dispositivo) — no se ha pedido, cada sesión se cierra de forma independiente.
- Configurar el tiempo de inactividad por el propio usuario (ajustable en preferencias) — fijo para todos los usuarios en esta historia.
- Recordar la pantalla en la que estaba el usuario para volver a ella tras un nuevo login — tras cerrar sesión (manual o automática) siempre se vuelve a la pantalla de login desde cero.
