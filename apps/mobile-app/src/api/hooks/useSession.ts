import { useMutation } from '@tanstack/react-query'
import { endSessionRequest, startSessionRequest } from '../requests/session'

// Wiring puro, sin test automatico -- ver nota en useAuth.ts.
export function useStartSession() {
  return useMutation({ mutationFn: startSessionRequest })
}

export function useEndSession() {
  return useMutation({ mutationFn: endSessionRequest })
}
