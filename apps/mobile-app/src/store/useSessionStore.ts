import { create } from 'zustand'
import type { TokenStorage } from './TokenStorage'

// Estado de cliente de la sesion autenticada (ADR-015). El email se persiste junto al
// sessionToken -- el backend nunca lo devuelve tras el login (LoginResponseDto/
// RegisterResponseDto solo traen userId/sessionToken, ver openapi.yaml), asi que si solo
// viviera en memoria se perderia al reiniciar la app aunque el token siguiera siendo valido.
const SESSION_STORAGE_KEY = 'mathmind.session'

interface PersistedSession {
  readonly userId: string
  readonly email: string
  readonly sessionToken: string
}

interface SessionState {
  readonly userId: string | null
  readonly email: string | null
  readonly sessionToken: string | null
  readonly isHydrated: boolean
  hydrate(storage: TokenStorage): Promise<void>
  login(session: PersistedSession, storage: TokenStorage): Promise<void>
  logout(storage: TokenStorage): Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  email: null,
  sessionToken: null,
  isHydrated: false,

  async hydrate(storage) {
    const raw = await storage.getItem(SESSION_STORAGE_KEY)
    const session: PersistedSession | null = raw ? (JSON.parse(raw) as PersistedSession) : null
    set({
      userId: session?.userId ?? null,
      email: session?.email ?? null,
      sessionToken: session?.sessionToken ?? null,
      isHydrated: true,
    })
  },

  async login(session, storage) {
    await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    set({ ...session, isHydrated: true })
  },

  async logout(storage) {
    await storage.deleteItem(SESSION_STORAGE_KEY)
    set({ userId: null, email: null, sessionToken: null, isHydrated: true })
  },
}))
