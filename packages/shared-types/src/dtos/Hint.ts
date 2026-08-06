// UC-003 Generate Hint (US-005).
export interface RequestHintRequestDto {
  readonly sessionId: string
  readonly exerciseId: string
}

// Nota de diseno pendiente de resolver en infraestructura: hintsUsed vive en Answer
// (ADR-004), pero un Answer solo se crea al responder (UC-002) -- las pistas se piden
// ANTES de responder. hintsUsedSoFar requiere por tanto un contador efimero por
// sesion+ejercicio (candidato: Redis, ya previsto en la Cache Strategy de
// ARCHITECTURE.md) que se traslada a Answer.hintsUsed solo al crear el Answer final.
export interface RequestHintResponseDto {
  readonly content: string
  readonly order: number
  readonly hintsUsedSoFar: number
}
