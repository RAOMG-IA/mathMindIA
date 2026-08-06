# Navigation

**Decisión tomada: Expo Router.** Registrado en [ADR-001](../../../../docs/ADR-001_LenguajesMetodologias.md).

Motivo: está construido sobre React Navigation (no se pierde acceso a sus primitivas si hiciera falta), es el default actual recomendado por Expo, y su enrutado por archivos mapea de forma casi 1:1 con las pantallas ya listadas en las [User Stories](../../../../docs/user-stories/).

El enrutado real vive en [`apps/mobile-app/app/`](../../app/), no en esta carpeta — esta carpeta se conserva vacía de código como referencia de la decisión. La lógica de cada pantalla vive en [`src/screens/`](../screens/README.md); los archivos de `app/` son wrappers finos de enrutado.
