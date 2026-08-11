import type {
  Exercise,
  ExerciseId,
  ExerciseRepository,
  FindByDifficultyBandQuery,
} from '@mathmind/shared-domain'

// Doble de test en memoria de ExerciseRepository -- ver packages/shared-domain/src/repositories/ExerciseRepository.ts.
export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly exercises = new Map<ExerciseId, Exercise>()

  async findById(id: ExerciseId): Promise<Exercise | null> {
    return this.exercises.get(id) ?? null
  }

  async findByDifficultyBand(query: FindByDifficultyBandQuery): Promise<readonly Exercise[]> {
    const excludeIds = new Set(query.excludeIds ?? [])
    return [...this.exercises.values()].filter(
      (exercise) =>
        exercise.academicLevel === query.academicLevel &&
        exercise.topic === query.topic &&
        exercise.type === query.type &&
        exercise.difficulty.value >= query.band.min &&
        exercise.difficulty.value <= query.band.max &&
        !excludeIds.has(exercise.id),
    )
  }

  async save(exercise: Exercise): Promise<void> {
    this.exercises.set(exercise.id, exercise)
  }
}
