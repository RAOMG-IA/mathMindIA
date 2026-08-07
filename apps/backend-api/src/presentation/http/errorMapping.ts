// Hallazgo Security 2026-08-07: routes.ts reenviaba error.message tal cual al cliente en toda
// ruta. Para las rutas que tocan la verificacion de autorizacion IDOR (sessions/end, answers,
// hints), EndSessionUseCase/ValidateAnswerUseCase/GenerateHintUseCase lanzan mensajes DISTINTOS
// para "sesion inexistente" ("No active session: X") y "sesion de otro usuario" ("Session X
// does not belong to user Y") -- reenviarlos permite a un atacante confirmar la existencia de
// un sessionId ajeno aunque no pueda actuar sobre el. Mismo principio que LoginUseCase ya
// aplica (mensaje generico identico para email inexistente/contrasena incorrecta), llevado
// aqui a nivel de Presentation para las rutas sensibles a IDOR.
//
// exposeMessage=true: rutas cuyo mensaje de error es contenido de producto pretendido (email
// duplicado en registro, credenciales invalidas en login, Tema invalido al iniciar sesion) --
// se reenvia tal cual, mismo comportamiento que antes.
// exposeMessage=false: rutas protegidas por verificacion de propiedad de una Session existente
// -- cualquier error se colapsa a un mensaje generico y 403, sin importar la causa exacta.
export interface ErrorResponse {
  readonly status: number
  readonly body: { readonly error: string }
}

const GENERIC_FORBIDDEN_MESSAGE = 'Forbidden or invalid session'

export function mapUseCaseError(error: unknown, exposeMessage: boolean): ErrorResponse {
  if (!exposeMessage) {
    return { status: 403, body: { error: GENERIC_FORBIDDEN_MESSAGE } }
  }

  const message = error instanceof Error ? error.message : 'Unexpected error'
  return { status: 400, body: { error: message } }
}
