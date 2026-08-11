export interface TimerState {
  readonly remainingMs: number
  readonly expired: boolean
}

// Logica pura del cronometro del ejercicio en curso -- separada del componente para poder
// testearla sin renderizar React ni usar temporizadores reales (mismo criterio que
// sessionRouting.ts/HomeScreen.validation.ts). `now` se pasa como parametro en vez de leer
// Date.now() internamente, para que el test controle el tiempo.
export function computeTimerState(exerciseShownAt: number, timeLimitMs: number, now: number): TimerState {
  const remainingMs = Math.max(0, timeLimitMs - (now - exerciseShownAt))
  return { remainingMs, expired: remainingMs === 0 }
}
