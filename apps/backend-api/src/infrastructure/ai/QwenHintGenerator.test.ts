// Trazabilidad: UC-003 (docs/use-cases/UC-003-generate-hint.md) + ADR-001 (transporte
// backend-api<->ai-engine: import directo in-process). Fake estructural de IAClient (solo
// generateHint, via Pick) -- sin LangChain real, ver QwenHintGenerator.ts.
//
// TDD Red: QwenHintGenerator todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import type { GenerateHintInput, GenerateHintOutput, IAClient } from '@mathmind/ai-engine'
import type { Exercise, ExerciseId } from '@mathmind/shared-domain'
import { InMemoryKnowledgeBaseIndex } from '@mathmind/shared-testing'
import { QwenHintGenerator } from './QwenHintGenerator.js'

class FakeIAClient implements Pick<IAClient, 'generateHint'> {
  readonly calls: GenerateHintInput[] = []

  constructor(private readonly response: GenerateHintOutput) {}

  async generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
    this.calls.push(input)
    return this.response
  }
}

function anExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'exercise-1' as ExerciseId,
    type: 'Resolution',
    academicLevel: 'Secundaria',
    topic: 'aritmetica-mental',
    statement: '23 + 19',
    correctAnswer: '42',
    difficulty: { value: 1200 },
    timer: { limitMs: 10000 },
    explanation: '23 + 19 = 42',
    generatedBy: 'manual',
    ...overrides,
  }
}

describe('QwenHintGenerator', () => {
  it('mapea exercise/order/previousHints a GenerateHintInput y devuelve el content de IAClient', async () => {
    const ia = new FakeIAClient({ content: 'Piensa en decenas' })
    const generator = new QwenHintGenerator(ia, new InMemoryKnowledgeBaseIndex())

    const result = await generator.generate({
      exercise: anExercise(),
      order: 2,
      previousHints: ['Suma primero las decenas'],
    })

    expect(result).toEqual({ content: 'Piensa en decenas' })
    expect(ia.calls).toEqual([
      {
        exerciseStatement: '23 + 19',
        correctAnswer: '42',
        previousHints: ['Suma primero las decenas'],
        hintOrder: 2,
        context: [],
      },
    ])
  })

  it('propaga el error si IAClient.generateHint lanza', async () => {
    const failingIA: Pick<IAClient, 'generateHint'> = {
      generateHint: async () => {
        throw new Error('IA unavailable')
      },
    }
    const generator = new QwenHintGenerator(failingIA, new InMemoryKnowledgeBaseIndex())

    await expect(
      generator.generate({ exercise: anExercise(), order: 1, previousHints: [] }),
    ).rejects.toThrow('IA unavailable')
  })
})
