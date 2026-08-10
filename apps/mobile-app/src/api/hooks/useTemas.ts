import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'
import { getTemasRequest } from '../requests/tema'
import { useSessionStore } from '../../store/useSessionStore'

// Wiring puro, sin test automatico -- ver nota en useAuth.ts. Catalogo completo (ADR-006
// adenda 2026-08-10) -- (app)/home.tsx filtra localmente por el AcademicLevel elegido, sin
// query param nuevo (cada Tema ya lleva su propio academicLevels).
export function useTemas() {
  const sessionToken = useSessionStore((state) => state.sessionToken)

  return useQuery({
    queryKey: queryKeys.temas,
    queryFn: getTemasRequest,
    enabled: Boolean(sessionToken),
    staleTime: Infinity, // catalogo de referencia, no cambia durante la sesion de la app
  })
}
