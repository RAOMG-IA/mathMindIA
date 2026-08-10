// Logica pura de enrutado inicial (ADR-015): (app)/_layout.tsx la usa para decidir si
// bloquear el acceso (sin sesion) o mostrar el contenido protegido, y app/index.tsx la usa
// para resolver a que ruta inicial navegar. Un unico punto de verdad en vez de repetir el
// mismo if/else de isHydrated+sessionToken en los dos sitios.
export type SessionRoute = 'loading' | 'login' | 'home'

export interface SessionRoutingState {
  readonly isHydrated: boolean
  readonly sessionToken: string | null
}

export function resolveSessionRoute(state: SessionRoutingState): SessionRoute {
  if (!state.isHydrated) {
    return 'loading'
  }
  return state.sessionToken ? 'home' : 'login'
}
