import type { GeneratedBy as PrismaGeneratedBy } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import type {
  Exercise,
  ExerciseId,
  ExerciseRepository,
  FindByDifficultyBandQuery,
} from '@mathmind/shared-domain'

// Prisma no permite '-' en identificadores de enum -- ver ADR-013 ("Enums").
function toDbGeneratedBy(generatedBy: Exercise['generatedBy']): PrismaGeneratedBy {
  return generatedBy === 'ai-batch' ? 'AiBatch' : 'Manual'
}

function toDomainGeneratedBy(generatedBy: PrismaGeneratedBy): Exercise['generatedBy'] {
  return generatedBy === 'AiBatch' ? 'ai-batch' : 'manual'
}

// Implementacion de ExerciseRepository sobre Prisma. Ver ADR-013 (tabla `exercises`,
// indice compuesto (academicLevel, topic, difficultyValue) critico para UC-008).
export class PrismaExerciseRepository implements ExerciseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: ExerciseId): Promise<Exercise | null> {
    const row = await this.prisma.exercise.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findByDifficultyBand(query: FindByDifficultyBandQuery): Promise<readonly Exercise[]> {
    const rows = await this.prisma.exercise.findMany({
      where: {
        academicLevel: query.academicLevel,
        topic: query.topic,
        difficultyValue: { gte: query.band.min, lte: query.band.max },
      },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async save(exercise: Exercise): Promise<void> {
    await this.prisma.exercise.upsert({
      where: { id: exercise.id },
      create: {
        id: exercise.id,
        type: exercise.type,
        academicLevel: exercise.academicLevel,
        topic: exercise.topic,
        statement: exercise.statement,
        options: exercise.options ? [...exercise.options] : [],
        correctAnswer: exercise.correctAnswer,
        difficultyValue: exercise.difficulty.value,
        timeLimitMs: exercise.timer.limitMs,
        explanation: exercise.explanation,
        generatedBy: toDbGeneratedBy(exercise.generatedBy),
      },
      update: {
        statement: exercise.statement,
        options: exercise.options ? [...exercise.options] : [],
        correctAnswer: exercise.correctAnswer,
        difficultyValue: exercise.difficulty.value,
        timeLimitMs: exercise.timer.limitMs,
        explanation: exercise.explanation,
      },
    })
  }

  private toDomain(row: {
    id: string
    type: Exercise['type']
    academicLevel: Exercise['academicLevel']
    topic: string
    statement: string
    options: string[]
    correctAnswer: string
    difficultyValue: number
    timeLimitMs: number
    explanation: string
    generatedBy: PrismaGeneratedBy
  }): Exercise {
    return {
      id: row.id as ExerciseId,
      type: row.type,
      academicLevel: row.academicLevel,
      topic: row.topic,
      statement: row.statement,
      options: row.options.length === 3 ? (row.options as [string, string, string]) : undefined,
      correctAnswer: row.correctAnswer,
      difficulty: { value: row.difficultyValue },
      timer: { limitMs: row.timeLimitMs },
      explanation: row.explanation,
      generatedBy: toDomainGeneratedBy(row.generatedBy),
    }
  }
}
