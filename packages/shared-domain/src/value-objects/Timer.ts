// Limite de tiempo configurable de un ejercicio. Ver docs/ADR/ADR-004_domain.md.
export interface Timer {
  readonly limitMs: number
}
