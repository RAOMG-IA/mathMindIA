// Puerto para hash/verificacion de contrasenas (ADR-012: "nunca en texto plano, hash con
// algoritmo estandar bcrypt o argon2"). Desacopla UC-009/UC-010 de la libreria concreta --
// implementacion real (bcrypt) en apps/backend-api/src/infrastructure/auth.
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>
  verify(plainPassword: string, hash: string): Promise<boolean>
}
