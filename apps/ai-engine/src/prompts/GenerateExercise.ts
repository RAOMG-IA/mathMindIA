import { z } from 'zod'
import type { AcademicLevel, ExerciseType, TemaCode } from '@mathmind/shared-domain'

// UC-001 Generate Exercise (Batch), paso 2: construir el prompt.
// tema.description y targetDifficulty vienen del catalogo de ADR-006
// (docs/ADR/ADR-006_math_topics.md) -- description como prompt hint, difficultyRange
// como target de exerciseRating inicial (ADR-005).
// context: chunks recuperados de la base de conocimiento (UC-011/ADR-014), opcional -- un
// Tema sin material consolidado sigue generando igual, ver GenerateExerciseBatchUseCase.
export interface GenerateExerciseInput {
  readonly tema: {
    readonly code: TemaCode
    readonly description: string
  }
  readonly academicLevel: AcademicLevel
  readonly type: ExerciseType
  readonly targetDifficulty: number
  readonly context?: readonly string[]
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

// Validacion de FORMA en tiempo de ejecucion (ADR-001, adenda 2026-08-06 -- Zod). No valida
// la invariante cruzada type='Test' => correctAnswer in options: eso sigue siendo
// responsabilidad de UC-001 (paso 4, ver comentario arriba), no de este contrato de frontera.
export const generateExerciseOutputSchema = z.object({
  statement: z.string().min(1),
  options: z.tuple([z.string(), z.string(), z.string()]).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
})

// Prompt minimo funcional -- el texto real (afinado, few-shot) sigue pendiente, ver
// prompts/README.md. Instruye JSON plano para poder parsear+validar con el schema de arriba.
export function buildGenerateExercisePrompt(input: GenerateExerciseInput): string {
  return [
    `Genera un ejercicio de calculo mental de tipo "${input.type}" para el tema "${input.tema.code}" (${input.tema.description}), nivel academico ${input.academicLevel}, dificultad objetivo ${input.targetDifficulty}.`,
    input.type === 'Test'
      ? 'Incluye exactamente 3 opciones en "options" y la respuesta correcta en "correctAnswer" (debe coincidir con una de las opciones).'
      : 'No incluyas la clave "options": el usuario debe resolverlo escribiendo la respuesta.',
    ...(input.context && input.context.length > 0
      ? [`Apoyate en este material de referencia, aportado por un administrador del sistema:\n${input.context.join('\n---\n')}`]
      : []),
    'Responde UNICAMENTE con un objeto JSON con las claves: statement, options (opcional), correctAnswer, explanation. Sin texto adicional.',
  ].join('\n')
}
