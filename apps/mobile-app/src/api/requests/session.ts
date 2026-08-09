import type {
  EndSessionRequestDto,
  EndSessionResponseDto,
  StartSessionRequestDto,
  StartSessionResponseDto,
} from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

export function startSessionRequest(dto: StartSessionRequestDto): Promise<StartSessionResponseDto> {
  return fetchClient<StartSessionResponseDto>('/sessions', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function endSessionRequest(dto: EndSessionRequestDto): Promise<EndSessionResponseDto> {
  return fetchClient<EndSessionResponseDto>('/sessions/end', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
