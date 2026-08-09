# Screens

Componentes de pantalla (Registro, Login, Inicio de sesión de entrenamiento, Resolver ejercicio, Estadísticas...), una por [User Story](../../../../docs/user-stories/) relevante. Sin lógica de negocio ni reglas matemáticas ([ARCHITECTURE.md](../../../../ARCHITECTURE.md), responsabilidades de `mobile-app`).

Con Expo Router (ver [src/navigation/README.md](../navigation/README.md)), los archivos de `app/` son wrappers finos de enrutado que importan y renderizan estos componentes — la lógica de pantalla vive aquí, no en `app/`, para mantenerla testable y reutilizable independientemente de la ruta.

**Mapeo ruta ↔ User Story fijado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: Registro, Login, Home (iniciar sesión de entrenamiento), Ejercicio (resolver + solicitar pista + finalizar), Resumen de sesión, Estadísticas.

## `LoginScreen` (US-002)

Primera pantalla real implementada. Estética calcada del `NeuralLoader` (`BackgroundGrid` + `COLORS` reexportados desde `src/components`) — no solo como referencia visual: mientras `useLogin` está pendiente, el propio `NeuralLoader` sustituye al formulario como estado de carga real.

Validación de formulario en `LoginScreen.validation.ts` (`validateLoginForm`, testeado — TDD Red→Green, 4/4), separada del componente para no depender de `QueryClientProvider`/`renderHook`: valida email y contraseña con los predicados de `@mathmind/shared-utils` (`isValidEmail`, `isValidPassword`/`MIN_PASSWORD_LENGTH` — la normativa de contraseña que ya exigía Security en `RegisterUseCase`, ahora única fuente de verdad compartida backend/mobile), y solo aporta el texto de error en español. El error genérico de credenciales incorrectas (US-002: "sin indicar cuál de los dos datos falló") es el que ya devuelve `LoginUseCase` tal cual (`login.error.message`), sin reinterpretarlo en el cliente.

Pendiente: el resto de pantallas (Registro, Home, Ejercicio, Resumen, Estadísticas).
