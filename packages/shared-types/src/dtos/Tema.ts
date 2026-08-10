import type { AcademicLevel, AreaCode } from '@mathmind/shared-domain'

// GET /temas (ADR-006 adenda 2026-08-10, US-003). Espejo de la entidad Tema de shared-domain --
// DTO propio (no reexport directo) porque es la forma que cruza la red, no el tipo de dominio.
export interface TemaAcademicLevelRangeDto {
  readonly level: AcademicLevel
  readonly difficultyRange: { readonly min: number; readonly max: number }
}

export interface TemaDto {
  readonly code: string
  readonly area: AreaCode
  readonly label: string
  readonly description: string
  readonly academicLevels: readonly TemaAcademicLevelRangeDto[]
  readonly prerequisites?: readonly string[]
}

// Sin request DTO: catalogo completo, sin filtrar por AcademicLevel (ver TemaRepository.findAll).
export interface GetTemasResponseDto {
  readonly temas: readonly TemaDto[]
}
