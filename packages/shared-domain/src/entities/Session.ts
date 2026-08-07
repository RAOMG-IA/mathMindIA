import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { Difficulty } from '../value-objects/Difficulty.js'
import type { ExerciseType } from '../value-objects/ExerciseType.js'
import type { TemaCode } from '../value-objects/TemaCode.js'
import type { SessionId, UserId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md.
// Invariante: todo Answer asociado referencia un Exercise cuyo type coincide con mode.
// ratingAtStart: snapshot de Difficulty (userRating para academicLevel) al crear la Session
// (UC-005) -- lo necesita EndSessionUseCase (UC-006) para calcular la variacion de rating
// durante la sesion, que no es recuperable de otro modo (los deltas de cada intento no se
// persisten individualmente, ver UpdateDifficultyUseCase).
// topic: hueco detectado al construir AnswerController -- UC-008 necesita Tema/AcademicLevel
// en cada respuesta (no solo al iniciar la Session) para seguir sirviendo ejercicios del mismo
// tema elegido en UC-005; sin persistirlo aqui no era recuperable tras el primer ejercicio.
export interface Session {
  readonly id: SessionId
  readonly userId: UserId
  readonly mode: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
  readonly ratingAtStart: Difficulty
  readonly startedAt: Date
  readonly endedAt?: Date
}
