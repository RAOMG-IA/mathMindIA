import type { PrismaClient } from '@prisma/client'
import type { ExerciseId, Hint, HintRepository } from '@mathmind/shared-domain'

// Implementacion de HintRepository sobre Prisma. Ver ADR-013 (tabla `hints`,
// unique (exerciseId, hintOrder)).
export class PrismaHintRepository implements HintRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByExerciseIdAndOrder(exerciseId: ExerciseId, order: number): Promise<Hint | null> {
    const row = await this.prisma.hint.findUnique({
      where: { exerciseId_hintOrder: { exerciseId, hintOrder: order } },
    })
    return row ? this.toDomain(row) : null
  }

  async save(hint: Hint): Promise<void> {
    await this.prisma.hint.upsert({
      where: { exerciseId_hintOrder: { exerciseId: hint.exerciseId, hintOrder: hint.order } },
      create: {
        id: hint.id,
        exerciseId: hint.exerciseId,
        hintOrder: hint.order,
        content: hint.content,
      },
      update: {
        id: hint.id,
        content: hint.content,
      },
    })
  }

  private toDomain(row: { id: string; exerciseId: string; hintOrder: number; content: string }): Hint {
    return {
      id: row.id as Hint['id'],
      exerciseId: row.exerciseId as ExerciseId,
      order: row.hintOrder,
      content: row.content,
    }
  }
}
