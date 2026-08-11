// Trazabilidad: UC-001 (docs/use-cases/UC-001-generate-exercise-batch.md) + ADR-006
// (docs/ADR/ADR-006_math_topics.md, Tema.academicLevels/difficultyRange) + ADR-004 (invariante
// type='Test' => exactamente 3 opciones y correctAnswer in options). El paso 1 del UC
// (seleccionar Tema con escasez) queda fuera de esta clase, ver GenerateExerciseBatchUseCase.ts.
//
// TDD Red: GenerateExerciseBatchUseCase todavia no tiene implementacion (declare class, sin
// cuerpo). Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la
// implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryExerciseRepository,
  InMemoryKnowledgeBaseIndex,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Tema } from '@mathmind/shared-domain'
import type { QwenClient } from '../llm/QwenClient.js'
import type { GenerateExerciseInput, GenerateExerciseOutput } from '../prompts/GenerateExercise.js'
import { GenerateExerciseBatchUseCase } from './GenerateExerciseBatchUseCase.js'

class QueuedExerciseGenerator implements Pick<QwenClient, 'generateExercise'> {
  private cursor = 0
  readonly calls: GenerateExerciseInput[] = []

  constructor(private readonly responses: readonly GenerateExerciseOutput[]) {}

  async generateExercise(input: GenerateExerciseInput): Promise<GenerateExerciseOutput> {
    this.calls.push(input)
    const response = this.responses[this.cursor]
    this.cursor += 1
    if (!response) {
      throw new Error('QueuedExerciseGenerator: no hay mas respuestas encoladas')
    }
    return response
  }
}

function aTema(overrides: Partial<Tema> = {}): Tema {
  return {
    code: 'arit.suma-resta',
    area: 'arit',
    label: 'Suma y resta',
    description: 'Operaciones basicas de suma y resta mental',
    academicLevels: [{ level: 'Primaria', difficultyRange: { min: 500, max: 750 } }],
    ...overrides,
  }
}

describe('GenerateExerciseBatchUseCase (UC-001)', () => {
  let exercises: InMemoryExerciseRepository

  beforeEach(() => {
    exercises = new InMemoryExerciseRepository()
  })

  it('genera y persiste un Exercise tipo Resolution valido al primer intento', async () => {
    const qwen = new QueuedExerciseGenerator([
      { statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' },
    ])
    const useCase = new GenerateExerciseBatchUseCase(
      qwen,
      exercises,
      new SequentialIdGenerator('exercise'),
      new InMemoryKnowledgeBaseIndex(),
    )

    const result = await useCase.execute({ tema: aTema(), academicLevel: 'Primaria', type: 'Resolution' })

    expect(result.exercises[0]!.id).toBe('exercise-1')
    expect(result.exercises[0]!.statement).toBe('15 + 27')
    expect(result.exercises[0]!.options).toBeUndefined()
    expect(result.exercises[0]!.generatedBy).toBe('ai-batch')
    expect(result.exercises[0]!.difficulty.value).toBe(625) // punto medio de 500-750
    expect(qwen.calls).toHaveLength(1)

    const persisted = await exercises.findById('exercise-1' as never)
    expect(persisted?.statement).toBe('15 + 27')
  })

  it('genera y persiste un Exercise tipo Test valido (3 opciones, correctAnswer incluida)', async () => {
    const qwen = new QueuedExerciseGenerator([
      { statement: '15 + 27', options: ['40', '42', '45'], correctAnswer: '42', explanation: '15 + 27 = 42' },
    ])
    const useCase = new GenerateExerciseBatchUseCase(
      qwen,
      exercises,
      new SequentialIdGenerator('exercise'),
      new InMemoryKnowledgeBaseIndex(),
    )

    const result = await useCase.execute({ tema: aTema(), academicLevel: 'Primaria', type: 'Test' })

    expect(result.exercises[0]!.options).toEqual(['40', '42', '45'])
    expect(result.exercises[0]!.correctAnswer).toBe('42')
  })

  it('flujo 4a, reintenta si el primer intento viola la invariante y el segundo es valido', async () => {
    const qwen = new QueuedExerciseGenerator([
      // Test sin options: viola la invariante (type='Test' exige exactamente 3 opciones).
      { statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' },
      { statement: '15 + 27', options: ['40', '42', '45'], correctAnswer: '42', explanation: '15 + 27 = 42' },
    ])
    const useCase = new GenerateExerciseBatchUseCase(
      qwen,
      exercises,
      new SequentialIdGenerator('exercise'),
      new InMemoryKnowledgeBaseIndex(),
    )

    const result = await useCase.execute({ tema: aTema(), academicLevel: 'Primaria', type: 'Test' })

    expect(qwen.calls).toHaveLength(2)
    expect(result.exercises[0]!.options).toEqual(['40', '42', '45'])
  })

  it('lanza tras agotar los intentos si ninguna generacion es valida', async () => {
    const qwen = new QueuedExerciseGenerator([
      { statement: 'a', correctAnswer: 'x', explanation: 'e' },
      { statement: 'b', correctAnswer: 'x', explanation: 'e' },
      { statement: 'c', correctAnswer: 'x', explanation: 'e' },
    ])
    const useCase = new GenerateExerciseBatchUseCase(
      qwen,
      exercises,
      new SequentialIdGenerator('exercise'),
      new InMemoryKnowledgeBaseIndex(),
    )

    await expect(useCase.execute({ tema: aTema(), academicLevel: 'Primaria', type: 'Test' })).rejects.toThrow()
    expect(qwen.calls.length).toBeGreaterThan(1)

    const all = await exercises.findByDifficultyBand({
      academicLevel: 'Primaria',
      topic: 'arit.suma-resta',
      band: { min: 0, max: 10000 },
    })
    expect(all).toHaveLength(0)
  })

  it('lanza si el Tema no aplica al AcademicLevel pedido', async () => {
    const qwen = new QueuedExerciseGenerator([])
    const useCase = new GenerateExerciseBatchUseCase(
      qwen,
      exercises,
      new SequentialIdGenerator('exercise'),
      new InMemoryKnowledgeBaseIndex(),
    )

    await expect(useCase.execute({ tema: aTema(), academicLevel: 'Secundaria', type: 'Resolution' })).rejects.toThrow()
    expect(qwen.calls).toHaveLength(0)
  })
})
