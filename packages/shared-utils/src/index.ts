// Un unico fichero, deliberado: shared-utils es el primer paquete shared-* con exports de
// VALOR (no solo tipos/interfaces) consumido en tiempo de ejecucion tanto por backend-api
// (NodeNext, exige extension .js en imports relativos) como por mobile-app (bundler Metro, no
// traduce ".js" a ".ts" -- solo resuelve especificadores sin extension). Un barrel con
// "export * from './x.js'" satisface a uno y rompe al otro; sin imports relativos internos, el
// conflicto no existe. shared-types no lo sufre porque sus exports son interfaces puras (se
// borran al compilar, Metro nunca las resuelve en tiempo de ejecucion).

// Validacion de formato de email, no de existencia real (eso solo puede confirmarlo el backend
// al intentar login/registro). Sin regex: un patron con varios grupos `+` separados por `.`
// es ambiguo (backtracking cuadratico sobre input malicioso) -- indexOf es O(n) y sin ese riesgo.
export function isValidEmail(email: string): boolean {
  if (/\s/.test(email)) {
    return false
  }
  const atIndex = email.indexOf('@')
  if (atIndex <= 0) {
    return false
  }
  const domain = email.slice(atIndex + 1)
  if (domain.includes('@')) {
    return false
  }
  const dotIndex = domain.indexOf('.')
  return dotIndex > 0 && dotIndex < domain.length - 1
}

// Normativa de contrasena establecida por Security (hallazgo 2026-08-07, ver
// docs/ADR/ADR-012_linea_base_seguridad.md SS4): longitud minima, no reglas de complejidad
// (OWASP ASVS L1). Unica fuente de verdad -- antes vivia solo como constante local de
// RegisterUseCase (backend-api); se extrae aqui para que mobile-app valide el mismo criterio
// en el formulario sin duplicar el numero.
export const MIN_PASSWORD_LENGTH = 8

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
}
