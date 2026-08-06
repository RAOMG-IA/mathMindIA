import type { PrismaClient } from '@prisma/client'
import type {
  Exercise,
  ExerciseId,
  ExerciseRepository,
  FindByDifficultyBandQuery,
} from '@mathmind/shared-domain'

// Implementacion de ExerciseRepository sobre Prisma. Ver ADR-013 (tabla `exercises`,
// indice compuesto (academicLevel, topic, difficultyValue) critico para UC-008).
// Sin cuerpo todavia -- pendiente de Tests (ADR-003).
export declare class PrismaExerciseRepository implements ExerciseRepository {
  constructor(prisma: PrismaClient)
  findById(id: ExerciseId): Promise<Exercise | null>
  findByDifficultyBand(query: FindByDifficultyBandQuery): Promise<readonly Exercise[]>
  save(exercise: Exercise): Promise<void>
}
