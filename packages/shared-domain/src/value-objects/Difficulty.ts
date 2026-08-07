import type { AcademicLevel } from './AcademicLevel.js'

// Rating continuo tipo Elo. Ver docs/ADR/ADR-005-adaptive-difficulty-engine.md.
// VO canonico, unificado entre ADR-004 y ADR-005 (sustituye al tipo "Rating" original de ADR-005).
export interface Difficulty {
  readonly value: number
}

// Semillas por AcademicLevel (ADR-005, "Escala y semillas iniciales" -- placeholder editorial,
// pendiente de calibrar, no derivado de datos). Usado cuando un User todavia no tiene Difficulty
// registrada para ese nivel: al registrarse (UC-009/US-001, "su rating inicial corresponde a la
// semilla de ese nivel") y como fallback en Casos de Uso que leen user.ratings.get(level).
export const SEED_RATING_BY_LEVEL: Readonly<Record<AcademicLevel, Difficulty>> = {
  Primaria: { value: 800 },
  Secundaria: { value: 1200 },
  Bachillerato: { value: 1600 },
  Ingenieria: { value: 2000 },
}
