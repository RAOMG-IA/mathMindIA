import type { AcademicLevel, IdGenerator } from '@mathmind/shared-domain'
import type { RegisterOutput, RegisterUseCase } from './RegisterUseCase.js'

const GUEST_ACADEMIC_LEVEL: AcademicLevel = 'Secundaria'
const GUEST_EMAIL_DOMAIN = 'invitado.mathmind.local'
const MAX_ATTEMPTS = 5

// Hash polinomico simple, no criptografico -- solo necesita ser determinista y repartir bien
// para un numero visible corto (US-009: "Publico<numero>"). Deliberadamente NO asume que `id`
// tiene forma de UUID (el puerto IdGenerator solo garantiza `generate(): string`, ver
// packages/shared-domain/src/ports/IdGenerator.ts) -- funciona igual con el id real
// (crypto.randomUUID()) que con el id de prueba (SequentialIdGenerator, 'guest-1', 'guest-2'...).
export function deriveGuestNumber(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1_000_000
  }
  return String(hash).padStart(6, '0')
}

export interface GuestLoginInput {
  readonly sourceIp: string
}

export interface GuestLoginOutput extends RegisterOutput {
  readonly email: string
}

// US-009: acceso de un clic sin registro ("Prueba sin registrarte"), pensado para que los
// tutores del TFM puedan evaluar la app sin la friccion de crear una cuenta. Ver "Contexto de
// dominio" de docs/user-stories/US-009-acceso-invitado.md.
//
// No es un modo "sin cuenta": es un alta real (RegisterUseCase, sin duplicar su logica) con
// datos generados por el sistema en vez de tecleados por la persona. `ids` es el mismo puerto
// IdGenerator ya inyectado en RegisterUseCase (Reglas de Reutilizacion, .ai/AGENTS.md) -- no se
// crea un puerto nuevo solo para el numero visible del nombre de usuario.
export class GuestLoginUseCase {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: GuestLoginInput): Promise<GuestLoginOutput> {
    let lastError: unknown

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const suffix = deriveGuestNumber(this.ids.generate())
      const email = `publico${suffix}@${GUEST_EMAIL_DOMAIN}`
      // "La pass sera la IP del navegador" (US-009) tomada tal cual como password rompe la
      // politica minima de 8 caracteres (ADR-012/RegisterUseCase) para IPs cortas reales
      // ("8.8.8.8" = 7, "::1" = 3) -- prefijo fijo + el mismo sufijo garantizan la longitud para
      // cualquier IP sin dejar de derivar de ella. No es un mecanismo de seguridad real (varias
      // personas en la misma red comparten IP publica) -- documentado como aceptado en la
      // propia historia, lo que evita colisiones de verdad es el numero aleatorio del email.
      const password = `guest-${input.sourceIp}-${suffix}`

      try {
        const result = await this.registerUseCase.execute({
          email,
          password,
          academicLevel: GUEST_ACADEMIC_LEVEL,
        })
        return { ...result, email }
      } catch (error) {
        // Unico motivo realista de fallo aqui (password/academicLevel siempre validos por
        // construccion propia): email duplicado -- reintenta con un numero nuevo, invisible
        // para quien pulso el boton (US-009, escenario "Colision de nombre generado").
        lastError = error
      }
    }

    throw lastError instanceof Error ? lastError : new Error('No se pudo crear la cuenta de invitado')
  }
}
