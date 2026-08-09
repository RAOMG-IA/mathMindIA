# Store

Estado de cliente con Zustand (sesión de entrenamiento en curso, temporizador, preferencias de UI). No sustituye al estado de servidor (eso vive en TanStack Query, ver `src/api`).

**Reparto formalizado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: Zustand guarda además el `sessionToken` (+ `userId`/`email`, que el backend no vuelve a devolver tras el login) en memoria, hidratado al arrancar la app desde `TokenStorage` — abstracción seleccionada por `Platform.OS` (`expo-secure-store` en nativo, `localStorage` en web).

`useSessionStore` implementado (TDD Red→Green, 5/5 tests — `useSessionStore.test.ts`): `hydrate`/`login`/`logout`, inyectando un `TokenStorage`. `TokenStorage.ts` define el puerto; `SecureStoreTokenStorage`/`WebTokenStorage` son sus implementaciones reales, seleccionadas por `createTokenStorage()` según `Platform.OS` — las tres quedan sin test automático (dependen de un módulo nativo, del DOM, o de `react-native`/Metro, no disponibles bajo Vitest/node), mismo criterio que `LangChainChatModel`/`XenovaEmbedder` en `backend-api`/`ai-engine`. Las pantallas (composición real) llaman a `createTokenStorage()` y pasan el resultado a `useSessionStore` — mismo patrón de inyección de dependencias que el resto del proyecto (`main.ts`). Temporizador de ejercicio en curso, pendiente.
