import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createTokenStorage } from '../src/store/createTokenStorage'
import { useSessionStore } from '../src/store/useSessionStore'

// Mantiene visible el splash nativo (app.json -- plugin expo-splash-screen) hasta que
// hydrate() resuelva mas abajo, en vez de que el SO lo oculte antes de tiempo y deje un frame
// en blanco antes de que NeuralLoader (app/index.tsx) tome el relevo. Ignora el error si ya
// esta oculto (puede pasar en Fast Refresh) -- mismo criterio boilerplate de la doc de Expo.
void SplashScreen.preventAutoHideAsync().catch(() => undefined)
// CSS global (scrollbar formal al diseño de la app) -- solo tiene efecto en Web, ver
// src/styles/README.md. Importado una unica vez aqui, no por pantalla.
import '../src/styles/global.css'

// Hueco real detectado al montar la primera pantalla que consume src/api (LoginScreen):
// ningun hook de TanStack Query es utilizable sin un QueryClientProvider en el arbol -- no
// existia hasta ahora porque src/api solo se habia probado a nivel de funcion pura/hook
// aislado, nunca renderizado de verdad. useState (no un singleton a nivel de modulo) para que
// el QueryClient sobreviva a re-renders pero no se comparta entre instancias en tests futuros.
//
// Mismo caso con SafeAreaProvider: react-native-safe-area-context ya era dependencia
// (package.json) pero nunca se habia montado -- hueco detectado al necesitar useSafeAreaInsets
// para el boton "Registrarse" en la esquina superior derecha de LoginScreen.
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())

  // Hidrata la sesion persistida (ADR-015: expo-secure-store/localStorage segun plataforma)
  // una sola vez al arrancar. Aqui y no en (app)/_layout.tsx ni en index.tsx porque ambos
  // dependen de isHydrated -- un unico punto de partida evita repetir el efecto en los dos.
  useEffect(() => {
    void useSessionStore
      .getState()
      .hydrate(createTokenStorage())
      .finally(() => void SplashScreen.hideAsync())
  }, [])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
