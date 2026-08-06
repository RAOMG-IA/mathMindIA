import type { PrismaClient } from '@prisma/client'
import type { ExerciseId, Hint, HintRepository } from '@mathmind/shared-domain'

// Implementacion de HintRepository sobre Prisma. Ver ADR-013 (tabla `hints`,
// unique (exerciseId, hintOrder)).
// Sin cuerpo todavia -- pendiente de Tests (ADR-003).
export declare class PrismaHintRepository implements HintRepository {
  constructor(prisma: PrismaClient)
  findByExerciseIdAndOrder(exerciseId: ExerciseId, order: number): Promise<Hint | null>
  save(hint: Hint): Promise<void>
}
