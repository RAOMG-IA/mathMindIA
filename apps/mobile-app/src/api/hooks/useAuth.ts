import { useMutation } from '@tanstack/react-query'
import { guestLoginRequest, loginRequest, registerRequest } from '../requests/auth'
import { createTokenStorage } from '../../store/createTokenStorage'
import { useSessionStore } from '../../store/useSessionStore'

// Wiring puro sobre useMutation -- sin test automatico, misma razon que routes.ts/main.ts en
// backend-api: requeriria renderizar un componente React real (QueryClientProvider +
// renderHook) para probarlo, tooling no presente en ningun otro paquete del monorepo. La
// logica que si es pura y testeable vive en ../requests/auth.ts.
//
// onSuccess escribe la sesion en Zustand: el backend nunca vuelve a devolver el email tras el
// login (LoginResponseDto/RegisterResponseDto solo traen userId/sessionToken, ver openapi.yaml)
// -- por eso se toma de `variables`, el propio request que el usuario acaba de enviar.
export function useRegister() {
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (response, variables) => {
      void useSessionStore
        .getState()
        .login({ userId: response.userId, email: variables.email, sessionToken: response.sessionToken }, createTokenStorage())
    },
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (response, variables) => {
      void useSessionStore
        .getState()
        .login({ userId: response.userId, email: variables.email, sessionToken: response.sessionToken }, createTokenStorage())
    },
  })
}

// US-009. A diferencia de useRegister/useLogin, no hay `variables` (guestLoginRequest no toma
// argumentos) -- el email se lee de la respuesta, la unica de las tres que lo incluye
// (GuestLoginResponseDto), precisamente porque el cliente no lo conoce de antemano.
export function useGuestLogin() {
  return useMutation({
    mutationFn: guestLoginRequest,
    onSuccess: (response) => {
      void useSessionStore
        .getState()
        .login({ userId: response.userId, email: response.email, sessionToken: response.sessionToken }, createTokenStorage())
    },
  })
}
