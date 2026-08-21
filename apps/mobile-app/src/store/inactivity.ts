// Logica pura del cierre de sesion por inactividad (US-010, adenda ADR-015). Separada de
// useInactivityLogout.ts (el hook, sin test -- depende de setInterval/window, mismo criterio ya
// aplicado a invalidateStatisticsOnSessionStart/useSession.ts) para poder testear la decision
// "en que fase estoy" sin renderizar nada ni depender de temporizadores reales.
export type InactivityPhase = 'active' | 'warning' | 'expired'

export interface InactivityPhaseInput {
  readonly now: number
  readonly lastActivityAt: number
  readonly timeoutMs: number
  readonly warningLeadMs: number
}

export function computeInactivityPhase(input: InactivityPhaseInput): InactivityPhase {
  const elapsedMs = input.now - input.lastActivityAt
  if (elapsedMs >= input.timeoutMs) {
    return 'expired'
  }
  if (elapsedMs >= input.timeoutMs - input.warningLeadMs) {
    return 'warning'
  }
  return 'active'
}
