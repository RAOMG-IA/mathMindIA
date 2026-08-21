import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { createTokenStorage } from './createTokenStorage'
import { computeInactivityPhase } from './inactivity'
import { useSessionStore } from './useSessionStore'

// US-010 (adenda ADR-015). Constantes: timeoutMs viene fijado por Product (US-010, 15 minutos);
// warningLeadMs es judgment call de Architecture (no lo fija la historia). Hook sin test directo
// (depende de setInterval/window, mismo criterio ya aplicado a hooks/use*.ts de src/api) -- la
// decision real ("en que fase estoy") vive en inactivity.ts, testeada aparte.
export const INACTIVITY_TIMEOUT_MS = 15 * 60_000
export const INACTIVITY_WARNING_LEAD_MS = 60_000
const CHECK_INTERVAL_MS = 1_000

export function useInactivityLogout() {
  const [showWarning, setShowWarning] = useState(false)
  const lastActivityAtRef = useRef(Date.now())

  const registerActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now()
    setShowWarning(false)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const phase = computeInactivityPhase({
        now: Date.now(),
        lastActivityAt: lastActivityAtRef.current,
        timeoutMs: INACTIVITY_TIMEOUT_MS,
        warningLeadMs: INACTIVITY_WARNING_LEAD_MS,
      })
      if (phase === 'expired') {
        void useSessionStore.getState().logout(createTokenStorage())
        return
      }
      setShowWarning(phase === 'warning')
    }, CHECK_INTERVAL_MS)

    // La interaccion por raton/teclado en Web de escritorio no siempre dispara los eventos de
    // touch sinteticos de react-native-web -- sin esto, un usuario que solo usa el raton nunca
    // resetearia el temporizador. En nativo la actividad llega via onTouchStart en la View raiz
    // de (app)/_layout.tsx (registerActivity expuesto abajo), no hace falta aqui.
    if (Platform.OS !== 'web') {
      return () => clearInterval(interval)
    }

    window.addEventListener('mousedown', registerActivity)
    window.addEventListener('keydown', registerActivity)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousedown', registerActivity)
      window.removeEventListener('keydown', registerActivity)
    }
  }, [registerActivity])

  return { showWarning, registerActivity }
}
