import type { GetTemasResponseDto } from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

export function getTemasRequest(): Promise<GetTemasResponseDto> {
  return fetchClient<GetTemasResponseDto>('/temas')
}
