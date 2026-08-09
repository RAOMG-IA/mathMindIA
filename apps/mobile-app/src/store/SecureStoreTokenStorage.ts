import * as SecureStore from 'expo-secure-store'
import type { TokenStorage } from './TokenStorage'

// Implementacion real de TokenStorage para iOS/Android (ADR-015) -- Keychain/Keystore via
// expo-secure-store. Sin test automatico: depende del modulo nativo de Expo, no disponible
// bajo Vitest/node, mismo criterio que LangChainChatModel/XenovaEmbedder en backend-api.
export class SecureStoreTokenStorage implements TokenStorage {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value)
  }

  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key)
  }
}
