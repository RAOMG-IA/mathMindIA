# Components

Componentes de UI reutilizables entre pantallas.

## `NeuralLoader`

Loader animado (estética fMRI: perfil craneal, cerebro con zonas de actividad pulsantes, símbolos matemáticos emergentes). Diseñado y validado con el usuario como prototipo HTML/CSS/SVG (iterado hasta que el trazado de cráneo/cerebro fue el correcto — el usuario aportó el SVG real del cráneo/cerebro, integrado tal cual en `anatomyPaths.ts`) antes de portarlo a componente real. Puramente decorativo, sin lógica de negocio ni props de dominio.

**Dependencias nuevas** (judgment call, mismo criterio que `expo-secure-store` en `src/store`): `react-native-svg` (trazado del cráneo/cerebro + gradientes), `react-native-reanimated` (animaciones en hilo nativo — requiere `react-native-reanimated/plugin` como último plugin de `babel.config.js`), `expo-blur` (blur del status pill), `react-native-web`/`react-dom` (bloqueaban el target Web de ADR-015 — sin ellos `expo export --platform web` fallaba).

**Diferencias deliberadas frente al prototipo HTML**, donde React Native no tiene equivalente directo:
- `filter: blur()` no existe en estilos de RN — las 5 zonas de actividad usan un `RadialGradient` de SVG (color → transparente) en vez de blur, visualmente equivalente.
- `backdrop-filter: blur()` tampoco existe — el status pill usa `expo-blur` (`BlurView`) en nativo; en web (sin efecto real) cae a un fondo semitransparente algo más opaco.
- El parpadeo del cursor (`step-end` en CSS) se aproxima con un fundido rápido ida-vuelta en vez de un corte instantáneo.
- Los símbolos matemáticos emergentes pierden el `blur()` de sus keyframes (RN no soporta blur en texto) — el arco de opacidad ya marcado compensa el efecto de "materializarse".

Sin test automático — es UI puramente visual/de animación, mismo criterio que otras piezas de la sesión que tocan un runtime no disponible bajo Vitest/node. Verificado con `npx tsc --noEmit`/`eslint` en verde y un bundle real de web (`npx expo export --platform web`, montado temporalmente en `app/index.tsx` y revertido) sin errores de import/runtime — no hay forma de probar nativo (iOS/Android) sin un simulador real, gap aceptado explícitamente.

Pendiente: montarlo en las pantallas reales (`src/screens`) cuando se implementen, según [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md).
