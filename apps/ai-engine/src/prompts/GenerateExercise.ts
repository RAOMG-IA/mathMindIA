import type { AcademicLevel, ExerciseType, TemaCode } from '@mathmind/shared-domain'

// UC-001 Generate Exercise (Batch), paso 2: construir el prompt.
// tema.description y targetDifficulty vienen del catalogo de ADR-006
// (docs/ADR/ADR-006_math_topics.md) -- description como prompt hint, difficultyRange
// como target de exerciseRating inicial (ADR-005).
export interface GenerateExerciseInput {
  readonly tema: {
    readonly code: TemaCode
    readonly description: string
  }
  readonly academicLevel: AcademicLevel
  readonly type: ExerciseType
  readonly targetDifficulty: number
}

// UC-001 paso 3: lo que Qwen debe devolver. Se valida en el paso 4 contra las
// invariantes de Exercise (ADR-004: si type='Test', exactamente 3 opciones y
// correctAnswer in options) antes de persistir -- ver docs/ADR/ADR-012_linea_base_seguridad.md
// (validacion de output de IA como control tambien de seguridad, no solo de calidad).
export interface GenerateExerciseOutput {
  readonly statement: string
  readonly options?: readonly [string, string, string]
  readonly correctAnswer: string
  readonly explanation: string
}

// PENDIENTE: validacion en tiempo de ejecucion de GenerateExerciseOutput antes de
// pasarlo a LangChain structured output (.withStructuredOutput() necesita un schema
// real, no solo un tipo TS que se borra en compilacion). Requiere decidir libreria
// de validacion (p.ej. zod) -- no estaba en ADR-001, no se asume aqui (mismo criterio
// ya aplicado a shared-config y a la libreria de navegacion de mobile-app).
