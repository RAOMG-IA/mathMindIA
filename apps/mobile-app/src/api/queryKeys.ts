// Query keys centralizadas -- statistics es la unica reutilizada por dos consumidores
// distintos (header global de (app) y la pantalla de Estadisticas, ver ADR-015), comparten
// cache exacta solo si usan la misma key en vez de repetirla como literal en cada sitio.
export const queryKeys = {
  statistics: ['statistics'] as const,
  temas: ['temas'] as const,
  // Sin GET real detras -- POST /sessions/end devuelve el resumen directamente (EndSessionResponseDto).
  // Sembrada via queryClient.setQueryData al finalizar (SessionScreen), leida sin queryFn por
  // session/[sessionId]/summary.tsx (US-006-resultado, siguiente pantalla).
  sessionSummary: (sessionId: string) => ['sessionSummary', sessionId] as const,
}
