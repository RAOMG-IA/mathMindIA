import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'
import { getUserStatisticsRequest } from '../requests/statistics'
import { useSessionStore } from '../../store/useSessionStore'

// Wiring puro, sin test automatico -- ver nota en useAuth.ts. Reutilizado tal cual por el
// header global de (app) y por (app)/statistics (ADR-015): misma queryKey, misma cache, sin
// pedir el dato dos veces. `enabled` es una guarda defensiva -- (app)/_layout.tsx ya bloquea
// el acceso sin sesion, esto solo evita una peticion sin token si algo la monta antes de tiempo.
export function useUserStatistics() {
  const sessionToken = useSessionStore((state) => state.sessionToken)

  return useQuery({
    queryKey: queryKeys.statistics,
    queryFn: getUserStatisticsRequest,
    enabled: Boolean(sessionToken),
  })
}
