import type { Tema, TemaRepository } from '@mathmind/shared-domain'

// GET /temas (ADR-006 adenda 2026-08-10, US-003). Sin input -- catalogo completo, el cliente
// filtra por AcademicLevel localmente (cada Tema ya lleva su propio academicLevels).
export class ListTemasUseCase {
  constructor(private readonly temas: TemaRepository) {}

  async execute(): Promise<readonly Tema[]> {
    return this.temas.findAll()
  }
}
