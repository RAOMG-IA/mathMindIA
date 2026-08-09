import { useMutation } from '@tanstack/react-query'
import { submitAnswerRequest } from '../requests/answer'

// Wiring puro, sin test automatico -- ver nota en useAuth.ts.
export function useSubmitAnswer() {
  return useMutation({ mutationFn: submitAnswerRequest })
}
