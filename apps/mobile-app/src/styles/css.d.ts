// expo-env.d.ts (que normalmente trae esta ambient declaration via `expo/types`) esta
// gitignoreado y se genera con `expo start`/`expo customize` -- en CI (npm ci + tsc, sin Expo
// CLI de por medio) nunca existe, asi que el import de global.css en app/_layout.tsx fallaba el
// typecheck con TS2882. Declaracion propia y trackeada para no depender de esa generacion.
declare module '*.css'
