import { useMutation } from '@tanstack/react-query'
import { requestHintRequest } from '../requests/hint'

// Wiring puro, sin test automatico -- ver nota en useAuth.ts.
export function useRequestHint() {
  return useMutation({ mutationFn: requestHintRequest })
}
