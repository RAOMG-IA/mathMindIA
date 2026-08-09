import type { GetUserStatisticsResponseDto } from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

export function getUserStatisticsRequest(): Promise<GetUserStatisticsResponseDto> {
  return fetchClient<GetUserStatisticsResponseDto>('/users/me/statistics')
}
