// Puntuacion de gamificacion. Distinto de Difficulty (senal interna del ADE).
// Ver docs/ADR/ADR-004_domain.md.
export interface Score {
  readonly points: number
}
