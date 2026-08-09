import type { TokenStorage } from './TokenStorage'

// Implementacion real de TokenStorage para web (ADR-015) -- localStorage, unico almacen
// disponible en un navegador (no hay Keychain/Keystore). Riesgo de seguridad aceptado y
// documentado en el ADR (sin cifrado de SO, expuesto a XSS), no mitigado en v1. Sin test
// automatico: depende de `window`, no disponible bajo el entorno Vitest/node por defecto de
// este proyecto (ningun otro paquete usa jsdom) -- mismo criterio que SecureStoreTokenStorage.
export class WebTokenStorage implements TokenStorage {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value)
  }

  async deleteItem(key: string): Promise<void> {
    window.localStorage.removeItem(key)
  }
}
