import type { SubmitAnswerRequestDto, SubmitAnswerResponseDto } from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

export function submitAnswerRequest(dto: SubmitAnswerRequestDto): Promise<SubmitAnswerResponseDto> {
  return fetchClient<SubmitAnswerResponseDto>('/answers', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
