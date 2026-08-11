import { z } from 'zod'

// UC-003 Generate Hint, paso 4: construir el prompt cuando no existe ya una Hint
// para ese (exerciseId, order). Incluye correctAnswer para que la IA genere una pista
// informada sin revelarla directamente, y previousHints para que la progresion sea
// cada vez mas detallada (US-005, escenario "Pistas progresivas").
// context: chunks recuperados de la base de conocimiento (UC-011/ADR-014), opcional -- un
// Tema sin material consolidado sigue generando igual, ver QwenHintGenerator.
export interface GenerateHintInput {
  readonly exerciseStatement: string
  readonly correctAnswer: string
  readonly previousHints: readonly string[]
  readonly hintOrder: number
  readonly context?: readonly string[]
}

export interface GenerateHintOutput {
  readonly content: string
}

// Validacion de FORMA en tiempo de ejecucion (ADR-001, adenda 2026-08-06 -- Zod).
export const generateHintOutputSchema = z.object({
  content: z.string().min(1),
})

function formatPreviousHints(previousHints: readonly string[]): string {
  return previousHints.map((hint, index) => `${index + 1}) ${hint}`).join(' ')
}

// Prompt minimo funcional -- el texto real (afinado, few-shot) sigue pendiente, ver
// prompts/README.md. Instruye JSON plano para poder parsear+validar con el schema de arriba.
export function buildGenerateHintPrompt(input: GenerateHintInput): string {
  return [
    `El estudiante no ha respondido correctamente a: "${input.exerciseStatement}". La respuesta correcta es "${input.correctAnswer}" -- no la reveles directamente.`,
    input.previousHints.length > 0
      ? `Pistas ya dadas, en orden: ${formatPreviousHints(input.previousHints)}`
      : 'Esta es la primera pista para este ejercicio.',
    `Genera la pista numero ${input.hintOrder}, mas especifica que las anteriores pero sin revelar la respuesta.`,
    ...(input.context && input.context.length > 0
      ? [`Apoyate en este material de referencia, aportado por un administrador del sistema:\n${input.context.join('\n---\n')}`]
      : []),
    'Responde UNICAMENTE con un objeto JSON con la clave: content. Sin texto adicional.',
  ].join('\n')
}
