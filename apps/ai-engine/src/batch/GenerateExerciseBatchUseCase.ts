import type {
  AcademicLevel,
  Exercise,
  ExerciseId,
  ExerciseRepository,
  ExerciseType,
  IdGenerator,
  KnowledgeBaseIndex,
  Tema,
} from '@mathmind/shared-domain'
import type { IAClient } from '../llm/IAClient.js'
import type { GenerateExerciseOutput } from '../prompts/GenerateExercise.js'

// Ver docs/use-cases/UC-001-generate-exercise-batch.md y docs/ADR/ADR-006_math_topics.md.
// Paso 1 del UC (seleccionar que Tema/AcademicLevel tiene escasez en el Pool) queda fuera de
// esta clase -- ExerciseRepository no expone una consulta de "escasez" y no se inventa aqui
// (mismo criterio que UC-008 flujo 2b, "a confirmar al implementar"); el Tema/AcademicLevel/type
// a generar llegan ya resueltos como input, decididos por quien invoque este Caso de Uso
// (scheduler, todavia sin construir).
export interface GenerateExerciseBatchInput {
  readonly tema: Tema
  readonly academicLevel: AcademicLevel
  readonly type: ExerciseType
  readonly count?: number
}

export interface GenerateExerciseBatchOutput {
  readonly exercises: Exercise[]
}

// UC-001 flujo 4a: "se descarta y se reintenta (maximo N intentos)". N no esta fijado en el
// UC -- judgment call documentado, mismo criterio que MIN_ATTEMPTS_PER_TOPIC en
// GetUserStatisticsUseCase. "revision manual" tras agotar intentos queda fuera de alcance (no
// hay cola/tabla de revision todavia) -- se lanza el ultimo error en su lugar.
const MAX_ATTEMPTS = 3

// Ningun ADR/UC fija el limite de tiempo de un ejercicio generado por IA -- Timer es una
// invariante de Exercise (ADR-004) que el LLM no decide (evita que la IA controle una regla
// deterministica, ver ARCHITECTURE.md "Estrategia IA"). Placeholder documentado, igual criterio
// que INITIAL_RATING: 15s es un presupuesto razonable de calculo mental, sin calibrar.
const DEFAULT_TIME_LIMIT_MS = 15000

// UC-001 paso 2 (retrieval, ver ADR-014_rag.md): cuantos chunks recuperar como maximo.
// Judgment call documentado, mismo criterio que MAX_ATTEMPTS/DEFAULT_TIME_LIMIT_MS de arriba.
const TOP_K = 3

function violatesExerciseInvariant(type: ExerciseType, output: GenerateExerciseOutput): boolean {
  if (type === 'Test') {
    return !output.options?.includes(output.correctAnswer)
  }
  return output.options !== undefined
}

export class GenerateExerciseBatchUseCase {
  constructor(
    private readonly ia: Pick<IAClient, 'generateExercise'> & Partial<Pick<IAClient, 'generateExercises'>>,
    private readonly exercises: ExerciseRepository,
    private readonly ids: IdGenerator,
    private readonly knowledgeBase: KnowledgeBaseIndex,
  ) {}

  async execute(input: GenerateExerciseBatchInput): Promise<GenerateExerciseBatchOutput> {
    const levelRange = input.tema.academicLevels.find((range) => range.level === input.academicLevel)
    if (!levelRange) {
      throw new Error(`Tema ${input.tema.code} does not apply to ${input.academicLevel}`)
    }

    const targetDifficulty = (levelRange.difficultyRange.min + levelRange.difficultyRange.max) / 2

    // UC-001 paso 2 (ADR-014_rag.md): recuperar material relevante, si existe. Sin tagging
    // fichero->Tema en la ingesta -- la query sale de lo que ya se conoce del Tema.
    const query = `${input.tema.code} ${input.tema.description}`
    const context = await this.knowledgeBase.search(query, TOP_K)

    const requested = input.count ?? 1
    let remaining = requested
    const saved: Exercise[] = []
    let lastError: Error = new Error('GenerateExerciseBatchUseCase: no attempts were made')

    for (let attempt = 0; attempt < MAX_ATTEMPTS && remaining > 0; attempt += 1) {
      const batchInput = {
        tema: { code: input.tema.code, description: input.tema.description },
        academicLevel: input.academicLevel,
        type: input.type,
        targetDifficulty,
        context,
        count: remaining,
      }

      const generatedList = this.ia.generateExercises
        ? await this.ia.generateExercises(batchInput)
        : [await this.ia.generateExercise(batchInput)]

      const valids: GenerateExerciseOutput[] = []
      for (const g of generatedList) {
        if (violatesExerciseInvariant(input.type, g)) {
          lastError = new Error(
            `Generated exercise for ${input.tema.code} violates Exercise invariants (type=${input.type})`,
          )
          continue
        }
        valids.push(g)
      }

      for (const generated of valids) {
        const exercise: Exercise = {
          id: this.ids.generate() as ExerciseId,
          type: input.type,
          academicLevel: input.academicLevel,
          topic: input.tema.code,
          statement: generated.statement,
          options: generated.options,
          correctAnswer: generated.correctAnswer,
          difficulty: { value: targetDifficulty },
          timer: { limitMs: DEFAULT_TIME_LIMIT_MS },
          explanation: generated.explanation,
          generatedBy: 'ai-batch',
        }

        await this.exercises.save(exercise)
        saved.push(exercise)
        remaining -= 1
      }
    }

    if (saved.length === 0) throw lastError
    return { exercises: saved }
  }
}
