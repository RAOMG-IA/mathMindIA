# Styles

Estilos globales, no por pantalla (esos viven como `*.styles.ts` sidecar junto a cada screen/componente, ver `src/screens/README.md`).

**`global.css`**: formaliza el scrollbar de la app al diseño (`COLORS` de `src/components/NeuralLoader/constants.ts`) en Web -- importado una sola vez desde `app/_layout.tsx` (Expo Router/Metro procesan `.css` global de forma nativa, `@expo/metro-config` trae el transformer; sin efecto en el bundle nativo iOS/Android). Colores hardcodeados en el propio `.css` (no puede importar el módulo TS de `COLORS`) -- mantener sincronizado a mano si la paleta cambia.

**Convención para iOS/Android**: CSS no tiene efecto nativo -- todo `ScrollView`/`FlatList` nuevo debe fijar `indicatorStyle="white"` (el indicador de scroll gris por defecto de iOS es casi ilegible sobre el fondo oscuro de la app; Android no expone una API de color de scrollbar equivalente, queda como limitación nativa aceptada). Ya aplicado en `HomeScreen` (`ScrollView`) y `Combobox` (`FlatList`).
