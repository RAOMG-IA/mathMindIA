// UC-003 Generate Hint, paso 4: construir el prompt cuando no existe ya una Hint
// para ese (exerciseId, order). Incluye correctAnswer para que Qwen genere una pista
// informada sin revelarla directamente, y previousHints para que la progresion sea
// cada vez mas detallada (US-005, escenario "Pistas progresivas").
export interface GenerateHintInput {
  readonly exerciseStatement: string
  readonly correctAnswer: string
  readonly previousHints: readonly string[]
  readonly hintOrder: number
}

export interface GenerateHintOutput {
  readonly content: string
}

// Misma nota que GenerateExercise.ts: validacion en tiempo de ejecucion pendiente
// de decidir libreria (zod u otra).
