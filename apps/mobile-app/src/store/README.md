# Store

Estado de cliente con Zustand (sesión de entrenamiento en curso, temporizador, preferencias de UI). No sustituye al estado de servidor (eso vive en TanStack Query, ver `src/api`).

**Reparto formalizado en [ADR-015](../../../../docs/ADR/ADR-015_mobile_app_screens.md)**: Zustand guarda además el `sessionToken` en memoria, hidratado desde `expo-secure-store` al arrancar la app — es estado de cliente (dónde vive el token en este dispositivo), no estado de servidor.

Pendiente de implementar.
