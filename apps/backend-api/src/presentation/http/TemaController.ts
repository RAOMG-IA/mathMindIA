import type { GetTemasResponseDto } from '@mathmind/shared-types'
import type { ListTemasUseCase } from '../../application/use-cases/ListTemasUseCase.js'

// Presentation layer -- GET /temas (ADR-006 adenda 2026-08-10). Sin userId: catalogo de
// referencia, igual para cualquier usuario autenticado.
export class TemaController {
  constructor(private readonly listTemasUseCase: ListTemasUseCase) {}

  async listTemas(): Promise<GetTemasResponseDto> {
    const temas = await this.listTemasUseCase.execute()

    return {
      temas: temas.map((tema) => ({
        code: tema.code,
        area: tema.area,
        label: tema.label,
        description: tema.description,
        academicLevels: tema.academicLevels,
        prerequisites: tema.prerequisites,
      })),
    }
  }
}
