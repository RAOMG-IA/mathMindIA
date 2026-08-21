import { Redirect, Slot } from 'expo-router'
import { View } from 'react-native'
import { AppHeader, InactivityWarningModal, NeuralLoader } from '../../src/components'
import { resolveSessionRoute } from '../../src/store/sessionRouting'
import { useInactivityLogout } from '../../src/store/useInactivityLogout'
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

  // US-010 (adenda ADR-015): montado solo aqui, nunca en (auth)/* -- este layout, por
  // construccion, solo renderiza contenido protegido cuando ya hay sesion (route === 'home'),
  // asi que no hace falta guardarlo contra "sesion inexistente" por separado. onTouchStart en la
  // View raiz cubre nativo; el propio hook cubre Web (mousedown/keydown de window).
  const { showWarning, registerActivity } = useInactivityLogout()

  if (route === 'loading') {
    return <NeuralLoader />
  }

  if (route === 'login') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View style={{ flex: 1 }} onTouchStart={registerActivity}>
      <AppHeader />
      <Slot />
      <InactivityWarningModal visible={showWarning} onContinue={registerActivity} />
    </View>
  )
}
