import { useSessionStore } from '../store/useSessionStore'

// Cliente base para las 8 rutas de apps/backend-api/openapi.yaml (ADR-015). EXPO_PUBLIC_* es
// el prefijo que Expo exige para inyectar variables de entorno en el bundle de cliente.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

// Unicas dos rutas del contrato que no requieren sessionToken -- ver openapi.yaml.
const PUBLIC_PATHS = new Set(['/auth/register', '/auth/login'])

interface ErrorBody {
  readonly error?: string
}

export async function fetchClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (!PUBLIC_PATHS.has(path)) {
    const sessionToken = useSessionStore.getState().sessionToken
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody
    throw new Error(body.error ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
