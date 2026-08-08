# ADR-015: Arquitectura de pantallas de `mobile-app`

## Estado

Propuesto

## Contexto

`mobile-app` sigue en scaffolding puro: `app/_layout.tsx` (un `<Stack />` vacío de expo-router), `app/index.tsx` (placeholder "MathMind AI"), y cinco `README.md` bajo `src/` (`screens`, `navigation`, `api`, `store`, `components`) que documentan intención pero dicen "Pendiente de implementar". Es el hueco de implementación más grande del proyecto: 11 Casos de Uso reales y verificados end-to-end en `backend-api`/`ai-engine` ([STATUS.md](../STATUS.md) #31, #33), y cero pantallas que los consuman.

**Objetivo de despliegue: Android, iOS y Web.** No es una decisión nueva de este ADR — Expo/Expo Router ya soportan salida web (`react-native-web`) de forma nativa, y `apps/mobile-app` es una única base de código para los tres. Sí tiene una consecuencia real sobre este ADR: cualquier decisión de plataforma (almacenamiento del `sessionToken`, en particular) tiene que funcionar en los tres targets, no solo en móvil nativo.

Las 8 [User Stories](../user-stories/) (US-001 a US-008) son deliberadamente agnósticas de capa por diseño (`docs/user-stories/README.md`: "no incluyen diseño técnico ni de arquitectura"). El propio scaffolding ya anticipaba, antes de este ADR, que la resolución sería una pantalla por historia: `src/screens/README.md` dice literalmente "una [pantalla] por User Story relevante", y `src/navigation/README.md` ya fijó Expo Router señalando que "su enrutado por archivos mapea de forma casi 1:1 con las pantallas ya listadas en las User Stories". El usuario, al plantear esta tarea, consideró inicialmente definir User Stories/Casos de Uso nuevos por pantalla, y rectificó explícitamente hacia este enfoque — completar la decisión de Architecture ya anticipada, sin inventar producto nuevo, mismo patrón que el mapeo de rutas REST antes de los Controllers ([STATUS.md](../STATUS.md) #25).

**Por qué esto no viola la restricción "no implementar código productivo" de [.ai/skills/architecture.md](../../.ai/skills/architecture.md)**: este documento fija un mapeo (ruta ↔ User Story), una decisión de librería (persistencia del token) y un patrón de capa (`src/api`) — no componentes React Native ni tests. Mismo criterio ya aplicado en ADR-013/ADR-014.

### Lo que faltaba resolver

- Qué ruta de Expo Router corresponde a cada User Story, y cómo se agrupan (pública vs. autenticada).
- Cómo se persiste el `sessionToken` en el dispositivo — sin decidir en ningún ADR hasta ahora.
- Cómo `src/api/` (su propio README: "Pendiente de implementar — requiere que los contratos DTO/API estén definidos primero") consume la API real — el bloqueo ya no existe: `apps/backend-api/openapi.yaml` documenta las 8 rutas reales.

Zustand y TanStack Query **no son decisiones nuevas de este ADR** — ya están ratificadas en [ADR-001](../ADR-001_LenguajesMetodologias.md) ("Frontend") y son dependencias reales en `apps/mobile-app/package.json`. Este ADR formaliza su reparto de responsabilidades, ya anticipado en `src/store/README.md`.

US-008 (Consolidar Base de Conocimiento) queda fuera del mapeo: su actor es el administrador del sistema vía acceso directo al servidor ([UC-011](../use-cases/UC-011-ingest-knowledge-base.md)), no tiene pantalla de `mobile-app`.

## Decisión

### Mapeo User Story → ruta Expo Router

Route groups de Expo Router (no afectan a la URL, sí a qué layout aplica y a la protección por autenticación):

| Ruta | User Story | Notas |
|---|---|---|
| `app/(auth)/register.tsx` | US-001 Registro | Layout público |
| `app/(auth)/login.tsx` | US-002 Login | Layout público |
| `app/(app)/_layout.tsx` | — | Guard de autenticación: sin `sessionToken` válido, redirige a `(auth)/login` |
| `app/(app)/home.tsx` | US-003 Iniciar Sesión de Entrenamiento | Elegir modo/nivel/tema, arranca la `Session` (UC-005) — nivel preseleccionado desde el perfil del usuario, editable antes de confirmar (AC ya fijado en US-003: "puede cambiarlo a otro nivel antes de confirmar"). Es la única pantalla donde se **confirma** un nuevo modo/nivel/tema; el header global (ver abajo) solo informa y enlaza aquí, no duplica el formulario |
| `app/(app)/session/[sessionId].tsx` | US-004 Resolver Ejercicio | Pantalla central: ejercicio actual, temporizador, envío de respuesta |
| — (misma pantalla que arriba) | US-005 Solicitar Pista | No es ruta propia: la propia historia la sitúa "en una sesión de entrenamiento activa" — es una acción sobre un ejercicio ya mostrado, no una navegación |
| — (misma pantalla que arriba) | US-006 Finalizar Sesión (acción) | Botón "Finalizar" dentro de la misma pantalla |
| `app/(app)/session/[sessionId]/summary.tsx` | US-006 Finalizar Sesión (resultado) | Resumen tras finalizar — los AC de la historia piden explícitamente mostrar aciertos/tiempo medio/variación de rating |
| `app/(app)/statistics.tsx` | US-007 Ver Estadísticas | Consume UC-007 (`GetUserStatisticsUseCase`) |
| `app/index.tsx` | — | Deja de ser el placeholder; resuelve a `(auth)/login` o `(app)/home` según haya `sessionToken` persistido |

### Header global de `(app)`

`app/(app)/_layout.tsx` renderiza una cabecera común a las cinco pantallas autenticadas (`home`, `session/[sessionId]`, `summary`, `statistics`), con tres elementos:

- **Email del usuario.** No proviene de ninguna llamada nueva: `LoginResponseDto`/`RegisterResponseDto` ([`openapi.yaml`](../../apps/backend-api/openapi.yaml)) devuelven únicamente `userId`/`sessionToken` — el backend nunca vuelve a exponer el email tras la autenticación. Se cachea en Zustand en el momento del login/registro (el propio formulario ya lo tiene, el usuario lo escribió) junto al `sessionToken`.
- **Nivel académico y rating actuales.** Sí existe como dato de servidor — `StatisticsResponseDto.academicLevel`/`.rating` (UC-007, `GET /users/me/statistics`). El header reutiliza el mismo hook de TanStack Query que alimenta `(app)/statistics` (misma query key, misma caché) en vez de crear un endpoint nuevo — coherente con "Cliente API" (abajo): un hook por ruta de `openapi.yaml`, no uno por lugar donde se muestra el dato.
- **Accesos directos** a `(app)/statistics` y a `(app)/home` (donde vive el selector real de modo/nivel/tema, ver fila de la tabla arriba) — navegación siempre visible, no un formulario duplicado.

**Hueco explícito, no resuelto aquí**: no existe ningún endpoint `GET /users/me` (perfil). Si en el futuro se necesitara refrescar el email (p. ej. tras verificarlo en otro dispositivo) sin volver a hacer login, haría falta añadirlo — fuera de alcance de este ADR, que se limita a lo que el contrato actual ya permite.

### Persistencia del `sessionToken`: `expo-secure-store` (nativo) + fallback web

Hueco real, sin decidir hasta ahora. Para iOS/Android se opta por `expo-secure-store` (Keychain/Keystore) frente a `AsyncStorage` (no cifra) — es el mecanismo recomendado por Expo para datos sensibles, y el `sessionToken` es exactamente eso (equivalente móvil del JWT que ya protege las rutas de `backend-api`, ver [ADR-012](ADR-012_linea_base_seguridad.md) §4).

**`expo-secure-store` no funciona en web** — no existe Keychain/Keystore en un navegador, y el propio despliegue web (ver Contexto) exige una solución que cubra las tres plataformas. Se resuelve con una abstracción mínima `TokenStorage` (`get`/`set`/`delete`) en `src/store`, con dos implementaciones seleccionadas por `Platform.OS`:

- **iOS/Android**: `expo-secure-store`, como arriba.
- **Web**: `localStorage`. **Riesgo aceptado, no mitigado en v1**: `localStorage` no tiene cifrado a nivel de SO y es accesible desde cualquier script de la página (expuesto a XSS), a diferencia de Keychain/Keystore — degradación real de la garantía de seguridad, no una equivalencia. Documentado explícitamente como hueco para Security Agent, mismo criterio que el riesgo de prompt injection ya señalado y diferido en [ADR-012](ADR-012_linea_base_seguridad.md)/[ADR-014](ADR-014_rag.md).

Nueva dependencia (`expo-secure-store`) — judgment call documentado igual que otras decisiones de librería resueltas "al implementar" en la sesión (Zod, pgvector).

### Cliente API (`src/api/`)

Un hook de TanStack Query por ruta de [`apps/backend-api/openapi.yaml`](../../apps/backend-api/openapi.yaml) (8 rutas ya documentadas ahí, contrato exacto). Un `fetchClient` base añade `Authorization: Bearer <sessionToken>` a toda petición salvo `/auth/register`/`/auth/login`. Tipado con los DTOs ya existentes de `packages/shared-types` — sin duplicar formas.

### Estado: TanStack Query vs. Zustand (formaliza, no decide de nuevo)

- **TanStack Query** — todo lo que viene de la API: perfil, ejercicio actual, estadísticas. Cache/revalidación resueltas por la propia librería.
- **Zustand** — estado puramente de cliente que no tiene sentido tratar como estado de servidor: el `sessionToken` en memoria (hidratado desde `TokenStorage` al arrancar la app — `expo-secure-store` en nativo, `localStorage` en web) y el cronómetro del ejercicio en curso.

## Consecuencias

### Positivas

- Cierra el hueco de implementación más grande del proyecto sin inventar producto nuevo — completa una decisión que el propio scaffolding ya anticipaba.
- Reutiliza al máximo lo ya construido: `openapi.yaml` como contrato exacto, DTOs de `packages/shared-types` sin duplicar, Zustand/TanStack Query ya ratificados en ADR-001.
- El guard de autenticación en `(app)/_layout.tsx` centraliza la protección de rutas en un único punto, en vez de repetir la comprobación en cada pantalla.

### Negativas / Riesgos

- `expo-secure-store` es una dependencia nueva, no instalada todavía — se instala al implementar, mismo criterio que otras librerías de la sesión.
- **El `sessionToken` en web queda con una garantía de seguridad más débil que en nativo**: `localStorage` no tiene cifrado a nivel de SO (a diferencia de Keychain/Keystore) y es accesible desde cualquier script con XSS. Riesgo real, señalado para Security Agent, no mitigado en v1 (ver sección de persistencia arriba).
- Agrupar US-004/US-005/US-006(acción) en una sola pantalla implica que esa pantalla concentra más responsabilidad de UI que el resto — aceptado porque refleja la propia UX descrita en las historias (todo ocurre "en una sesión de entrenamiento activa"), no una simplificación arbitraria.

## Fuera de alcance

- Escribir componentes/pantallas reales (React Native/TSX) o sus tests — ciclo TDD posterior (Test Agent → Developer Agent), mismo patrón que UC-011.
- Instalar `expo-secure-store` (`npm install`) — se instala al implementar.
- Diseño visual/UI (colores, tipografía, sistema de componentes) — no es una decisión de Architecture.
- Onboarding, recuperación de contraseña, edición de perfil — no tienen User Story que los respalde todavía; no se inventan aquí.
- Mitigar el riesgo de `localStorage` en web (p. ej. migrar a cookies `httpOnly` emitidas por `backend-api`) — cambiaría el contrato de autenticación actual (hoy Bearer token vía JSON, ver `openapi.yaml`), fuera de alcance de este ADR. Señalado para Security Agent.

## Trazabilidad

Registrado en `.ai/prompts/architecture.md`.
