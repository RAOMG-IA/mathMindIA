// Rating continuo tipo Elo. Ver docs/ADR/ADR-005-adaptive-difficulty-engine.md.
// VO canonico, unificado entre ADR-004 y ADR-005 (sustituye al tipo "Rating" original de ADR-005).
export interface Difficulty {
  readonly value: number
}

// Rating de partida para un usuario sin Difficulty registrada todavia en un AcademicLevel.
// Mismo valor usado como ejemplo en AdaptiveDifficultyEngine.test.ts.
export const INITIAL_RATING: Difficulty = { value: 1200 }
