// US-006-resultado: formateo puro del EndSessionResponseDto para la pantalla de resumen.
// Sin dependencias de React/RN -- logica pura, testeada por separado (mismo criterio que
// SessionScreen.timer.ts/mentalMathTips.ts).

// null cuando totalAttempts es 0 (US-006, "Sesion sin ejercicios respondidos") -- evita
// dividir entre cero, la pantalla muestra un mensaje distinto en ese caso en vez de "0%".
export function computeAccuracyPercent(correctAttempts: number, totalAttempts: number): number | null {
  if (totalAttempts === 0) return null
  return Math.round((correctAttempts / totalAttempts) * 100)
}

export function formatAvgResponseTime(avgResponseTimeMs: number): string {
  return `${(avgResponseTimeMs / 1000).toFixed(1)}s`
}

// ratingChange puede ser negativo (ADR-005) -- el signo "+" explicito en positivos es lo que
// distingue "mejoraste" de "empeoraste" de un vistazo, un numero negativo ya se lee solo.
export function formatRatingChange(ratingChange: number): string {
  // AdaptiveDifficultyEngine (ADR-005) devuelve un float de coma flotante -- sin redondear se
  // veia p. ej. "+21.974072196278257" en la UI. Mismo criterio que formatAvgResponseTime
  // (.toFixed) en vez de mostrar la precision interna del motor.
  const rounded = ratingChange.toFixed(1)
  return ratingChange > 0 ? `+${rounded}` : rounded
}
