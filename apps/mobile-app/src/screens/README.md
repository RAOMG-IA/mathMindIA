# Screens

Componentes de pantalla (Registro, Login, Inicio de sesión de entrenamiento, Resolver ejercicio, Estadísticas...), una por [User Story](../../../../docs/user-stories/) relevante. Sin lógica de negocio ni reglas matemáticas ([ARCHITECTURE.md](../../../../ARCHITECTURE.md), responsabilidades de `mobile-app`).

Con Expo Router (ver [src/navigation/README.md](../navigation/README.md)), los archivos de `app/` son wrappers finos de enrutado que importan y renderizan estos componentes — la lógica de pantalla vive aquí, no en `app/`, para mantenerla testable y reutilizable independientemente de la ruta.

**Mapeo ruta ↔ User Story fijado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: Registro, Login, Home (iniciar sesión de entrenamiento), Ejercicio (resolver + solicitar pista + finalizar), Resumen de sesión, Estadísticas.

## `LoginScreen` (US-002)

Primera pantalla real implementada. Estética calcada del `NeuralLoader` (`BackgroundGrid` + `COLORS` reexportados desde `src/components`) — no solo como referencia visual: mientras `useLogin` está pendiente, el propio `NeuralLoader` sustituye al formulario como estado de carga real.

Validación de formulario en `LoginScreen.validation.ts` (`validateLoginForm`, testeado — TDD Red→Green, 4/4), separada del componente para no depender de `QueryClientProvider`/`renderHook`: valida email y contraseña con los predicados de `@mathmind/shared-utils` (`isValidEmail`, `isValidPassword`/`MIN_PASSWORD_LENGTH` — la normativa de contraseña que ya exigía Security en `RegisterUseCase`, ahora única fuente de verdad compartida backend/mobile), y solo aporta el texto de error en español. El error genérico de credenciales incorrectas (US-002: "sin indicar cuál de los dos datos falló") es el que ya devuelve `LoginUseCase` tal cual (`login.error.message`), sin reinterpretarlo en el cliente.

Fondo ampliado después a `BackgroundGrid` + `ParticleField` + `COLORS` (ver `RegisterScreen` más abajo) — es el fondo estándar para toda pantalla nueva, no solo login.

## `RegisterScreen` (US-001)

Mismo patrón que `LoginScreen`, sin reinventar nada: `BackgroundGrid`+`ParticleField`+`card` centrada+`NeuralLoader` como estado de carga. Dos diferencias reales, no cosméticas:

- **Selector "Nivel de complejidad"** (antes "Nivel académico" — copy cambiado a petición del usuario, para no asociar lingüísticamente el nivel personal con el nivel a practicar; mismo dato, `RegisterRequestDto.academicLevel`): 4 estrellas acumulativas (glifo Unicode `★`/`☆`, sin icon library), no 4 opciones independientes — marcar la N-ésima marca también la 1..N-1 ("un ingeniero no puede ser sin tener primaria", dato ordinal). Etiqueta bajo las estrellas informando el nivel según la última marcada. Campo obligatorio (`RegisterScreen.validation.ts`, `validateRegisterForm`, TDD, 5/5 tests — AC de US-001 "Nivel académico obligatorio"; la validación no cambió con el rediseño del selector). `AcademicLevel` se deriva de `RegisterRequestDto['academicLevel']` (`@mathmind/shared-types`) en vez de añadir `@mathmind/shared-domain` como dependencia nueva solo por un alias de tipo.
- **Mensaje de servidor traducido, atribuido al campo de email**: US-001 exige un texto concreto en español para email duplicado ("indicando que el email ya está en uso"), a diferencia de US-002 (solo exige genérico, sin importar idioma exacto). `isEmailAlreadyRegisteredError()` detecta el prefijo del mensaje real de `RegisterUseCase` (inglés, `exposeMessage: true`) y `emailTakenError` lo traduce, enrutándolo al prop `error` de `EmailInput` — no al banner genérico — porque es la "validación de existencia" pedida para el registro. `LoginScreen` sigue mostrando `login.error.message` tal cual en el banner genérico, sin tocar el campo de email (ADR-012: el login nunca debe indicar si un email existe).

Enlaza de vuelta a `(auth)/login`. El `@ts-expect-error` que protegía la ruta `/(auth)/register` en `LoginScreen.tsx` se quitó al crear esta pantalla — TypeScript lo marcó como "directiva no usada" en cuanto la ruta existió de verdad, confirmando en la práctica por qué se prefirió esa forma a `as any`.

## Componentes de input compartidos (`../components/inputs/`)

`EmailInput`/`PasswordInput` sustituyen los `TextInput` inline que antes tenía cada pantalla (`field`/`label`/`input`/`inputError`/`errorText` estaban duplicados byte a byte entre `LoginScreen.styles.ts` y `RegisterScreen.styles.ts`). Puramente presentacionales — `value`/`onChangeText`/`error`, sin validación de formato ni de red dentro; cada pantalla sigue validando con su propio `*.validation.ts` y decide a qué campo atribuir cada error de servidor (ver arriba). `PasswordInput` revela el valor al mantener pulsado (`Pressable` con `onHoverIn`/`onHoverOut` + `onPressIn`/`onPressOut`), no al alternar.

## `StatisticsScreen` (US-007)

Pantalla de solo lectura: sin formulario ni mutación, consume únicamente `useUserStatistics` (misma query key/cache que `AppHeader`, ADR-015 — no se pide el dato dos veces).

El DTO (`GetUserStatisticsResponseDto`) solo expone `byTopic` plano: `strengths`/`weaknesses` se calculan en el propio backend (`GetUserStatisticsUseCase`) pero no se serializan. `StatisticsScreen.validation.ts` (`deriveTopicBreakdown`, TDD 6/6) los deriva en el cliente — ordena por `accuracy` y filtra por `MIN_ATTEMPTS_FOR_RANKING = 3`, replicando a mano el umbral `MIN_ATTEMPTS_PER_TOPIC` del backend (sin constante compartida entre ambos lados, hay que sincronizarlo manualmente si cambia).

Tres estados cubren los tres escenarios de US-007: tarjeta de score/nivel/rating siempre visible mientras haya `data` (independiente del historial); desglose por tema con badges "Fuerte"/"A mejorar" cuando `byTopic.length > 0`; tarjeta de estado vacío explícita cuando `byTopic.length === 0` (US-007, "Usuario sin historial" — una respuesta 200 con array vacío, nunca un error). La barra de accuracy es un `View` con `width` en porcentaje, sin librería de gráficos (no hay ninguna en el repo y no se justifica para una sola pantalla).

El `@ts-expect-error` que protegía la ruta `/(app)/statistics` en `AppHeader.tsx` se quitó al crear esta pantalla, mismo motivo que en `RegisterScreen`.

Pendiente: Ejercicio, Resumen.
