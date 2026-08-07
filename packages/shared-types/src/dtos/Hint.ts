// UC-003 Generate Hint (US-005).
// elapsedMs: tiempo transcurrido desde que se mostro el ejercicio, en ms -- lo necesita
// GenerateHintUseCase para verificar la precondicion "el tiempo limite expiro" (hueco
// detectado al mapear rutas: faltaba en este DTO pese a ser input obligatorio del Caso de Uso).
export interface RequestHintRequestDto {
  readonly sessionId: string
  readonly exerciseId: string
  readonly elapsedMs: number
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
