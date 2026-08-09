// Puerto minimo de persistencia del sessionToken, ver ADR-015. Seleccionado por plataforma:
// expo-secure-store en iOS/Android (Keychain/Keystore), localStorage en web -- este ultimo con
// una garantia de seguridad mas debil (sin cifrado de SO, expuesto a XSS), riesgo aceptado y
// documentado en el ADR, no mitigado en v1. Las implementaciones concretas quedan sin test
// automatico (dependen de un modulo nativo o del DOM, no disponibles bajo Vitest/node) --
// mismo criterio ya aplicado a LangChainChatModel/XenovaEmbedder en backend-api/ai-engine.
export interface TokenStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  deleteItem(key: string): Promise<void>
}
