// CORS_ALLOWED_ORIGINS: allowlist explicita de origenes externos, via variable de entorno
// (ADR-012 SS1, "gestion de secretos: solo variables de entorno" -- mismo criterio aplicado
// aqui a configuracion, no solo a secretos). Sin wildcard ni default permisivo: una lista vacia
// (variable sin definir) rechaza cualquier origin de navegador, para no exponer la API por
// error si alguien olvida configurarla.
export function parseAllowedOrigins(raw: string | undefined): readonly string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

// `origin` es `undefined` en peticiones sin cabecera Origin -- no solo navegadores same-origin,
// tambien cualquier cliente no-navegador (apps nativas iOS/Android via fetch, curl, servidor a
// servidor). CORS es un mecanismo que solo aplican los navegadores; bloquear estas peticiones
// no anadiria seguridad real (no hay same-origin policy que hacer cumplir) y romperia
// mobile-app en iOS/Android (ADR-015, objetivo de despliegue Android+iOS+Web).
export function isOriginAllowed(origin: string | undefined, allowedOrigins: readonly string[]): boolean {
  if (!origin) return true
  return allowedOrigins.includes(origin)
}
