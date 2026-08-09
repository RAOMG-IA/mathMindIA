import { Platform } from 'react-native'
import type { TokenStorage } from './TokenStorage'
import { SecureStoreTokenStorage } from './SecureStoreTokenStorage'
import { WebTokenStorage } from './WebTokenStorage'

// Seleccion de implementacion por plataforma (ADR-015). Sin test automatico: importa
// react-native, cuyo resuelto real (Platform.ios.ts/Platform.android.ts/Platform.web.ts) lo
// hace Metro, no el resolvedor de Node/Vite que usa Vitest -- mismo criterio de wiring puro
// que apps/backend-api/src/presentation/main.ts.
export function createTokenStorage(): TokenStorage {
  return Platform.OS === 'web' ? new WebTokenStorage() : new SecureStoreTokenStorage()
}
