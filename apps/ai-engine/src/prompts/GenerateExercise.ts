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
  readonly count?: number
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

// Modelos observados (Groq/gpt-oss-120b) devuelven respuestas numericas de calculo mental
// como JSON number en vez de string (p. ej. correctAnswer: 42 en vez de "42"), pese a que el
// prompt pide un string -- coacciona number->string aqui en vez de exigir al LLM un formato
// que no respeta de forma fiable (ADR-012: validar/normalizar output de IA en el borde).
const stringifiableValue = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(z.string().min(1))

// Validacion de FORMA en tiempo de ejecucion (ADR-001, adenda 2026-08-06 -- Zod). No valida
// la invariante cruzada type='Test' => correctAnswer in options: eso sigue siendo
// responsabilidad de UC-001 (paso 4, ver comentario arriba), no de este contrato de frontera.
export const generateExerciseOutputSchema = z.object({
  statement: z.string().min(1),
  options: z.tuple([stringifiableValue, stringifiableValue, stringifiableValue]).optional(),
  correctAnswer: stringifiableValue,
  explanation: z.string().min(1),
})

// Prompt minimo funcional -- el texto real (afinado, few-shot) sigue pendiente, ver
// prompts/README.md. Instruye JSON plano para poder parsear+validar con el schema de arriba.
export function buildGenerateExercisePrompt(input: GenerateExerciseInput): string {
  const count = input.count ?? 1
  return [
    `Genera ${count} ejercicio${count === 1 ? '' : 's'} de calculo mental de tipo "${input.type}" para el tema "${input.tema.code}" (${input.tema.description}), nivel academico ${input.academicLevel}, dificultad objetivo ${input.targetDifficulty}.`,
    input.type === 'Test'
      ? 'El "statement" debe mostrar UNICAMENTE la operacion o el problema en si (los numeros/simbolos, o el enunciado si es un problema con contexto) -- NO empieces con frases como "Calcula mentalmente", "Resuelve mentalmente" ni equivalentes: toda la aplicacion ya es de calculo mental, esa instruccion es implicita y no debe repetirse en cada ejercicio. Incluye exactamente 3 opciones en "options" y la respuesta correcta en "correctAnswer" (debe coincidir con una de las opciones).'
      : 'No incluyas la clave "options": el usuario debe resolverlo escribiendo la respuesta.',
    ...(input.context && input.context.length > 0
      ? [`Apoyate en este material de referencia, aportado por un administrador del sistema:\n${input.context.join('\n---\n')}`]
      : []),
    count === 1
      ? 'Responde UNICAMENTE con un objeto JSON con las claves: statement, options (opcional), correctAnswer, explanation. Sin texto adicional.'
      : `Responde UNICAMENTE con un arreglo JSON con exactamente ${count} objetos, cada uno con las claves: statement, options (opcional), correctAnswer, explanation. Sin texto adicional.`,
  ].join('\n')
}

// Esquema para validar multiples ejercicios cuando se solicita un batch
export const generateExerciseOutputsSchema = z.array(generateExerciseOutputSchema)
