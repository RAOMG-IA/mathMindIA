import { Redirect } from 'expo-router'
import { NeuralLoader } from '../src/components'
import { resolveSessionRoute } from '../src/store/sessionRouting'
import { useSessionStore } from '../src/store/useSessionStore'

// Deja de ser el placeholder "MathMind AI" (ADR-015): resuelve a (auth)/login o (app)/home
// segun haya sessionToken persistido, en cuanto RootLayout termina de hidratar la sesion.
// Misma logica pura que el guard de (app)/_layout.tsx (resolveSessionRoute) -- un unico punto
// de verdad para "que significa isHydrated+sessionToken" en vez de repetir el if/else aqui.
export default function IndexRoute() {
  const isHydrated = useSessionStore((state) => state.isHydrated)
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const route = resolveSessionRoute({ isHydrated, sessionToken })

  if (route === 'loading') {
    return <NeuralLoader />
  }

  if (route === 'login') {
    return <Redirect href="/(auth)/login" />
  }

  // (app)/home todavia no existe (siguiente pantalla pendiente, ADR-015).
  // @ts-expect-error -- ruta real pendiente de construir
  return <Redirect href="/(app)/home" />
}
