import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { endSessionRequest, startSessionRequest } from '../requests/session'
import { queryKeys } from '../queryKeys'

// Extraida de useStartSession para que sea testeable sin renderizar un componente React --
// QueryClient es una clase plana de @tanstack/query-core, se puede instanciar y espiar
// directamente (ver useSession.test.ts). Invalida sin comparar contra el valor anterior:
// arrancar una sesion es la unica via por la que mode/academicLevel cambian (US-003,
// StartSessionRequestDto), y volver a pedir estadisticas ya al dia es mas simple y mas
// seguro que llevar la cuenta de si el nivel/modo realmente cambio.
export function invalidateStatisticsOnSessionStart(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.statistics })
}

// Mismo motivo que invalidateStatisticsOnSessionStart: score/rating cambian con cada Answer
// registrada durante la sesion (ADR-005), pero nada invalidaba `statistics` al terminar --
// AppHeader/Home seguian mostrando el rating de antes de la sesion hasta la siguiente recarga.
// Detectado al construir SessionSummaryScreen (US-006-resultado), que muestra el ratingChange
// exacto de esta sesion -- sin esto, ese cambio no se reflejaba en ningun otro sitio de la app.
export function invalidateStatisticsOnSessionEnd(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.statistics })
}

// Wiring puro, sin test automatico -- ver nota en useAuth.ts.
export function useStartSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startSessionRequest,
    onSuccess: () => {
      invalidateStatisticsOnSessionStart(queryClient)
    },
  })
}

export function useEndSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endSessionRequest,
    onSuccess: () => {
      invalidateStatisticsOnSessionEnd(queryClient)
    },
  })
}
