import type { GetTemasResponseDto, RegisterRequestDto, StartSessionRequestDto } from '@mathmind/shared-types'

// AcademicLevel/ExerciseType derivados de DTOs ya existentes (import type, se borran al
// compilar) -- shared-types no reexporta esos tipos sueltos, mismo criterio ya aplicado en
// RegisterScreen.validation.ts para no añadir @mathmind/shared-domain como dependencia real de
// mobile-app.
export type TemaDto = GetTemasResponseDto['temas'][number]
export type AcademicLevel = RegisterRequestDto['academicLevel']
export type ExerciseType = StartSessionRequestDto['mode']

// Catalogo completo -> solo los Temas que aplican al AcademicLevel elegido (US-003, ADR-006
// adenda 2026-08-10: GET /temas no filtra server-side, el cliente filtra localmente).
export function temasForLevel(temas: readonly TemaDto[], level: AcademicLevel | null): readonly TemaDto[] {
  if (!level) return []
  return temas.filter((tema) => tema.academicLevels.some((entry) => entry.level === level))
}

export interface HomeFormErrors {
  readonly mode?: string
  readonly academicLevel?: string
  readonly topic?: string
}

// `availableTemas` ya filtrados por temasForLevel -- un topic que no este en esa lista cubre
// el escenario "Tema inexistente" de US-003 (incluye el caso de que el usuario cambiara de
// nivel despues de elegir un Tema que ya no aplica).
export function validateHomeForm(
  mode: ExerciseType | null,
  academicLevel: AcademicLevel | null,
  topic: string | null,
  availableTemas: readonly TemaDto[],
): HomeFormErrors {
  const errors: { mode?: string; academicLevel?: string; topic?: string } = {}

  if (!mode) {
    errors.mode = 'Elige un modo'
  }
  if (!academicLevel) {
    errors.academicLevel = 'Elige un nivel académico'
  }
  if (!topic || !availableTemas.some((tema) => tema.code === topic)) {
    errors.topic = 'Elige un tema del catálogo'
  }

  return errors
}
