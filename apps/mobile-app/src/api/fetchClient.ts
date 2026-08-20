import { useSessionStore } from '../store/useSessionStore'

// Cliente base para las 8 rutas de apps/backend-api/openapi.yaml (ADR-015). EXPO_PUBLIC_* es
// el prefijo que Expo exige para inyectar variables de entorno en el bundle de cliente.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

// Unicas tres rutas del contrato que no requieren sessionToken -- ver openapi.yaml.
const PUBLIC_PATHS = new Set(['/auth/register', '/auth/login', '/auth/guest'])

interface ErrorBody {
  readonly error?: string
}

export async function fetchClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isProtectedPath = !PUBLIC_PATHS.has(path)
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (isProtectedPath) {
    const sessionToken = useSessionStore.getState().sessionToken
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    // Hueco detectado al validar Home tras rotar JWT_SECRET (STATUS.md): un sessionToken
    // invalido/expirado seguia "logueado" en el cliente -- las queries fallaban en silencio
    // (React Query las deja en estado error, la UI solo veia listas vacias sin explicacion).
    // expireSession() (no logout()): fetchClient.ts es deliberadamente puro, sin depender de
    // react-native (createTokenStorage.ts la necesita para elegir storage por plataforma).
    if (isProtectedPath && response.status === 401) {
      useSessionStore.getState().expireSession()
    }

    const body = (await response.json().catch(() => ({}))) as ErrorBody
    throw new Error(body.error ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
