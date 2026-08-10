import { Redirect, Slot } from 'expo-router'
import { View } from 'react-native'
import { AppHeader, NeuralLoader } from '../../src/components'
import { resolveSessionRoute } from '../../src/store/sessionRouting'
import { useSessionStore } from '../../src/store/useSessionStore'

// Guard de autenticacion centralizado (ADR-015): protege las 5 pantallas de (app) en un unico
// punto en vez de repetir la comprobacion en cada una. resolveSessionRoute (testeada aparte)
// distingue "todavia no sabemos" (esperar a que RootLayout termine de hidratar la sesion) de
// "ya sabemos que no hay sesion" (redirigir de verdad) -- sin esa distincion, un usuario con
// sesion valida veria un parpadeo a login mientras expo-secure-store/localStorage responde.
export default function AppLayout() {
  const isHydrated = useSessionStore((state) => state.isHydrated)
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const route = resolveSessionRoute({ isHydrated, sessionToken })

  if (route === 'loading') {
    return <NeuralLoader />
  }

  if (route === 'login') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Slot />
    </View>
  )
}
