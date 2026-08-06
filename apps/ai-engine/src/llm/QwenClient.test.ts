// Trazabilidad: UC-001 (docs/use-cases/UC-001-generate-exercise-batch.md) y UC-003
// (docs/use-cases/UC-003-generate-hint.md) + ADR-001 (adenda 2026-08-06, Zod para
// validacion de forma) + ADR-012 (docs/ADR/ADR-012_linea_base_seguridad.md, validar output
// de IA como control de seguridad, no solo de calidad). ChatModel se inyecta como fake --
// sin red real, ver ChatModel.ts.
//
// TDD Red: QwenClient todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import type { ChatModel } from './ChatModel.js'
import { QwenClient } from './QwenClient.js'

class FakeChatModel implements ChatModel {
  constructor(private readonly response: string) {}

  async invoke(): Promise<string> {
    return this.response
  }
}

describe('QwenClient', () => {
  describe('generateHint (UC-003)', () => {
    it('parsea una respuesta valida', async () => {
      const client = new QwenClient(new FakeChatModel(JSON.stringify({ content: 'Piensa en decenas' })))

      const result = await client.generateHint({
        exerciseStatement: '23 + 19',
        correctAnswer: '42',
        previousHints: [],
        hintOrder: 1,
      })

      expect(result).toEqual({ content: 'Piensa en decenas' })
    })

    it('lanza si la respuesta no tiene la forma esperada', async () => {
      const client = new QwenClient(new FakeChatModel(JSON.stringify({ wrongField: 'x' })))

      await expect(
        client.generateHint({ exerciseStatement: '23 + 19', correctAnswer: '42', previousHints: [], hintOrder: 1 }),
      ).rejects.toThrow()
    })

    it('lanza si la respuesta no es JSON valido', async () => {
      const client = new QwenClient(new FakeChatModel('esto no es json'))

      await expect(
        client.generateHint({ exerciseStatement: '23 + 19', correctAnswer: '42', previousHints: [], hintOrder: 1 }),
      ).rejects.toThrow()
    })
  })

  describe('generateExercise (UC-001)', () => {
    it('parsea una respuesta valida (tipo Resolution, sin options)', async () => {
      const client = new QwenClient(
        new FakeChatModel(JSON.stringify({ statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' })),
      )

      const result = await client.generateExercise({
        tema: { code: 'arit.suma-resta', description: 'Suma y resta' },
        academicLevel: 'Primaria',
        type: 'Resolution',
        targetDifficulty: 600,
      })

      expect(result).toEqual({ statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' })
    })

    it('lanza si la respuesta no tiene la forma esperada', async () => {
      const client = new QwenClient(new FakeChatModel(JSON.stringify({ statement: '15 + 27' })))

      await expect(
        client.generateExercise({
          tema: { code: 'arit.suma-resta', description: 'Suma y resta' },
          academicLevel: 'Primaria',
          type: 'Resolution',
          targetDifficulty: 600,
        }),
      ).rejects.toThrow()
    })
  })
})
