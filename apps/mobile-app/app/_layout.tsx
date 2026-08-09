import { useState } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hueco real detectado al montar la primera pantalla que consume src/api (LoginScreen):
// ningun hook de TanStack Query es utilizable sin un QueryClientProvider en el arbol -- no
// existia hasta ahora porque src/api solo se habia probado a nivel de funcion pura/hook
// aislado, nunca renderizado de verdad. useState (no un singleton a nivel de modulo) para que
// el QueryClient sobreviva a re-renders pero no se comparta entre instancias en tests futuros.
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  )
}
