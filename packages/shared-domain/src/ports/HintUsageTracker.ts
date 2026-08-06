import type { ExerciseId, SessionId } from '../entities/ids.js'

// Contador efimero de pistas usadas en el intento en curso, por (sessionId, exerciseId).
// Existe porque hintsUsed vive en Answer (ADR-004), pero un Answer solo se crea al responder
// (UC-002) -- las pistas se piden ANTES de eso (UC-003). Ver la nota de diseno original en
// packages/shared-types/src/dtos/Hint.ts (candidato de implementacion: Redis, ya previsto en
// la Cache Strategy de ARCHITECTURE.md). ValidateAnswerUseCase (UC-002) sigue recibiendo
// hintsUsed como input del llamador -- es responsabilidad de Presentation trasladar aqui el
// valor leido de este tracker al crear el Answer final.
export interface HintUsageTracker {
  incrementAndGet(sessionId: SessionId, exerciseId: ExerciseId): Promise<number>
}
