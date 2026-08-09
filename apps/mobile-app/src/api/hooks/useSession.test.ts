import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '../queryKeys'
import { invalidateStatisticsOnSessionStart } from './useSession'

// QueryClient es una clase plana de @tanstack/query-core -- se puede instanciar y espiar sin
// renderizar ningun componente React, a diferencia de los propios hooks (useStartSession),
// que siguen sin test automatico (ver nota en useAuth.ts).
describe('invalidateStatisticsOnSessionStart', () => {
  it('invalida la queryKey de estadisticas al cambiar de nivel/modo (US-003)', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateStatisticsOnSessionStart(queryClient)

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.statistics })
  })
})
