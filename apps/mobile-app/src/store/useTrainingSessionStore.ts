import { create } from 'zustand'
import type { ExercisePublicDto, StartSessionRequestDto } from '@mathmind/shared-types'

// Derivado de StartSessionRequestDto (import type, se borra al compilar) -- mismo criterio que
// HomeScreen.validation.ts, sin depender de @mathmind/shared-domain.
export type SessionMode = StartSessionRequestDto['mode']

export interface HintEntry {
  readonly order: number
  readonly content: string
}

// Estado de cliente de la sesion de entrenamiento EN CURSO (US-004/US-005/US-006-accion,
// ADR-015: "el cronometro del ejercicio en curso" vive en Zustand, no en TanStack Query -- no
// hay ningun GET que exponga "el ejercicio actual de una Session", solo llega via la respuesta
// de POST /sessions (aqui, en start()) o POST /answers (setExercise()). Sin persistencia
// (TokenStorage no aplica) -- si el usuario entra directo a /session/<id> sin haber pasado por
// Home, sessionId sigue en null y la pantalla redirige a Home (hueco de arquitectura aceptado,
// ver STATUS.md).
interface TrainingSessionState {
  readonly sessionId: string | null
  readonly mode: SessionMode | null
  readonly currentExercise: ExercisePublicDto | null
  readonly exerciseShownAt: number | null
  readonly hints: readonly HintEntry[]
  start(params: { sessionId: string; mode: SessionMode; exercise: ExercisePublicDto }): void
  setExercise(exercise: ExercisePublicDto): void
  addHint(hint: HintEntry): void
  clear(): void
}

export const useTrainingSessionStore = create<TrainingSessionState>((set) => ({
  sessionId: null,
  mode: null,
  currentExercise: null,
  exerciseShownAt: null,
  hints: [],

  start({ sessionId, mode, exercise }) {
    set({ sessionId, mode, currentExercise: exercise, exerciseShownAt: Date.now(), hints: [] })
  },

  setExercise(exercise) {
    set({ currentExercise: exercise, exerciseShownAt: Date.now(), hints: [] })
  },

  addHint(hint) {
    set((state) => ({ hints: [...state.hints, hint] }))
  },

  clear() {
    set({ sessionId: null, mode: null, currentExercise: null, exerciseShownAt: null, hints: [] })
  },
}))
