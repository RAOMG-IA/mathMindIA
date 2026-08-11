import { beforeEach, describe, expect, it } from 'vitest'
import { useTrainingSessionStore } from './useTrainingSessionStore'

function anExercise(overrides: Partial<{ id: string; type: 'Test' | 'Resolution'; statement: string; timeLimitMs: number }> = {}) {
  return {
    id: 'exercise-1',
    type: 'Resolution' as const,
    statement: '2 + 2',
    timeLimitMs: 10000,
    ...overrides,
  }
}

describe('useTrainingSessionStore', () => {
  beforeEach(() => {
    useTrainingSessionStore.setState({
      sessionId: null,
      mode: null,
      currentExercise: null,
      exerciseShownAt: null,
      hints: [],
    })
  })

  it('empieza sin sesion en curso', () => {
    const state = useTrainingSessionStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.currentExercise).toBeNull()
  })

  it('start() fija sessionId/mode/currentExercise y marca exerciseShownAt', () => {
    const before = Date.now()
    useTrainingSessionStore.getState().start({ sessionId: 'session-1', mode: 'Resolution', exercise: anExercise() })

    const state = useTrainingSessionStore.getState()
    expect(state.sessionId).toBe('session-1')
    expect(state.mode).toBe('Resolution')
    expect(state.currentExercise).toEqual(anExercise())
    expect(state.exerciseShownAt).toBeGreaterThanOrEqual(before)
    expect(state.hints).toEqual([])
  })

  it('setExercise() sustituye el ejercicio actual, reinicia el cronometro y limpia las pistas', () => {
    useTrainingSessionStore.getState().start({ sessionId: 'session-1', mode: 'Resolution', exercise: anExercise() })
    useTrainingSessionStore.getState().addHint({ order: 1, content: 'Pista 1' })

    const nextExercise = anExercise({ id: 'exercise-2', statement: '3 + 3' })
    useTrainingSessionStore.getState().setExercise(nextExercise)

    const state = useTrainingSessionStore.getState()
    expect(state.currentExercise).toEqual(nextExercise)
    expect(state.hints).toEqual([])
  })

  it('addHint() acumula pistas en orden', () => {
    useTrainingSessionStore.getState().start({ sessionId: 'session-1', mode: 'Resolution', exercise: anExercise() })
    useTrainingSessionStore.getState().addHint({ order: 1, content: 'Pista 1' })
    useTrainingSessionStore.getState().addHint({ order: 2, content: 'Pista 2' })

    expect(useTrainingSessionStore.getState().hints).toEqual([
      { order: 1, content: 'Pista 1' },
      { order: 2, content: 'Pista 2' },
    ])
  })

  it('clear() vuelve al estado inicial', () => {
    useTrainingSessionStore.getState().start({ sessionId: 'session-1', mode: 'Resolution', exercise: anExercise() })
    useTrainingSessionStore.getState().addHint({ order: 1, content: 'Pista 1' })

    useTrainingSessionStore.getState().clear()

    const state = useTrainingSessionStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.mode).toBeNull()
    expect(state.currentExercise).toBeNull()
    expect(state.exerciseShownAt).toBeNull()
    expect(state.hints).toEqual([])
  })
})
