import type { RequestHintRequestDto, RequestHintResponseDto } from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

export function requestHintRequest(dto: RequestHintRequestDto): Promise<RequestHintResponseDto> {
  return fetchClient<RequestHintResponseDto>('/hints', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
