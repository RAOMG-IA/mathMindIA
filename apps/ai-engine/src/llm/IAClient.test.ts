// Trazabilidad: UC-001 (docs/use-cases/UC-001-generate-exercise-batch.md) y UC-003
// (docs/use-cases/UC-003-generate-hint.md) + ADR-001 (adenda 2026-08-06, Zod para
// validacion de forma) + ADR-012 (docs/ADR/ADR-012_linea_base_seguridad.md, validar output
// de IA como control de seguridad, no solo de calidad). ChatModel se inyecta como fake --
// sin red real, ver ChatModel.ts.
//
// TDD Red: IAClient todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import type { ChatModel } from './ChatModel.js'
import { IAClient } from './IAClient.js'

class FakeChatModel implements ChatModel {
  constructor(private readonly response: string) {}

  async invoke(): Promise<string> {
    return this.response
  }
}

describe('IAClient', () => {
  describe('generateHint (UC-003)', () => {
    it('parsea una respuesta valida', async () => {
      const client = new IAClient(new FakeChatModel(JSON.stringify({ content: 'Piensa en decenas' })))

      const result = await client.generateHint({
        exerciseStatement: '23 + 19',
        correctAnswer: '42',
        previousHints: [],
        hintOrder: 1,
      })

      expect(result).toEqual({ content: 'Piensa en decenas' })
    })

    it('lanza si la respuesta no tiene la forma esperada', async () => {
      const client = new IAClient(new FakeChatModel(JSON.stringify({ wrongField: 'x' })))

      await expect(
        client.generateHint({ exerciseStatement: '23 + 19', correctAnswer: '42', previousHints: [], hintOrder: 1 }),
      ).rejects.toThrow()
    })

    it('lanza si la respuesta no es JSON valido', async () => {
      const client = new IAClient(new FakeChatModel('esto no es json'))

      await expect(
        client.generateHint({ exerciseStatement: '23 + 19', correctAnswer: '42', previousHints: [], hintOrder: 1 }),
      ).rejects.toThrow()
    })
  })

  describe('generateExercise (UC-001)', () => {
    it('parsea una respuesta valida (tipo Resolution, sin options)', async () => {
      // IAClient ahora espera que el modelo devuelva un arreglo para soportar batch
      const client = new IAClient(
        new FakeChatModel(JSON.stringify([{ statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' }])),
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
      const client = new IAClient(new FakeChatModel(JSON.stringify([{ statement: '15 + 27' }])))

      await expect(
        client.generateExercise({
          tema: { code: 'arit.suma-resta', description: 'Suma y resta' },
          academicLevel: 'Primaria',
          type: 'Resolution',
          targetDifficulty: 600,
        }),
      ).rejects.toThrow()
    })

    it('parsea un arreglo de ejercicios (generateExercises)', async () => {
      const client = new IAClient(
        new FakeChatModel(JSON.stringify([
          { statement: '15 + 27', correctAnswer: '42', explanation: '15 + 27 = 42' },
          { statement: '5 + 7', correctAnswer: '12', explanation: '5 + 7 = 12' },
        ])),
      )

      const results = await client.generateExercises({
        tema: { code: 'arit.suma-resta', description: 'Suma y resta' },
        academicLevel: 'Primaria',
        type: 'Resolution',
        targetDifficulty: 600,
        count: 2,
      })

      expect(results).toHaveLength(2)
      expect(results[0]!.statement).toBe('15 + 27')
    })

    it('coacciona correctAnswer/options numericos (JSON number) a string', async () => {
      const client = new IAClient(
        new FakeChatModel(
          JSON.stringify([{ statement: '15 + 27', options: [40, 42, 45], correctAnswer: 42, explanation: '15 + 27 = 42' }]),
        ),
      )

      const result = await client.generateExercise({
        tema: { code: 'arit.suma-resta', description: 'Suma y resta' },
        academicLevel: 'Primaria',
        type: 'Test',
        targetDifficulty: 600,
      })

      expect(result.correctAnswer).toBe('42')
      expect(result.options).toEqual(['40', '42', '45'])
    })
  })
})
