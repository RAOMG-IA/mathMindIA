import { describe, expect, it } from 'vitest'
import { computeInactivityPhase } from './inactivity'

const TIMEOUT_MS = 15 * 60_000
const WARNING_LEAD_MS = 60_000

describe('computeInactivityPhase (US-010)', () => {
  it('sigue "active" justo antes de entrar en la ventana de aviso', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000 - (TIMEOUT_MS - WARNING_LEAD_MS - 1),
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('active')
  })

  it('pasa a "warning" exactamente al entrar en la ventana de aviso', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000 - (TIMEOUT_MS - WARNING_LEAD_MS),
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('warning')
  })

  it('sigue "warning" justo antes de cumplirse el timeout completo', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000 - (TIMEOUT_MS - 1),
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('warning')
  })

  it('pasa a "expired" exactamente al cumplirse el timeout', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000 - TIMEOUT_MS,
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('expired')
  })

  it('sigue "expired" mucho despues del timeout (no vuelve a "warning")', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000 - TIMEOUT_MS * 10,
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('expired')
  })

  it('actividad justo ahora ("now" == "lastActivityAt") es "active"', () => {
    const phase = computeInactivityPhase({
      now: 1_000_000,
      lastActivityAt: 1_000_000,
      timeoutMs: TIMEOUT_MS,
      warningLeadMs: WARNING_LEAD_MS,
    })
    expect(phase).toBe('active')
  })
})
