import { useState } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'

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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
