# Security Agent
Review OWASP Top 10 risks, secrets, dependencies and validation.

---

## 2026-08-05 — ADR-012 Línea Base de Seguridad (sustituye a docs/ADR/Security/)

**Input**: El usuario añadió una sección "Línea base de seguridad" en `.ai/AGENTS.md` y un paquete de 5 ADR (`docs/ADR/Security/`, ADR-007 a ADR-011: aislamiento de secretos, prompt injection, RBAC de agentes, filtrado de contexto, clasificación de datos LLM) pidiendo revisión y feedback.

**Contexto utilizado**: STATUS.md (Implementación al 0%), ADR-004 (dominio), ADR-005 (motor de dificultad), ADR-006 (taxonomía), UC-001/UC-003 (únicos puntos donde el sistema construye prompts hacia Qwen), US-001/US-002 (registro/login pendientes).

**Decisión tomada**: Se identificó que el paquete original modelaba una postura de seguridad de plataforma en producción (Vault, RBAC formal, Zero Trust) desproporcionada para el estado real del proyecto, y que aseguraba principalmente a los agentes de desarrollo entre sí sin cubrir el riesgo real del producto (prompt injection en UC-001/UC-003, datos de menores dado que `AcademicLevel.Primaria` implica usuarios potencialmente menores de 14 años). Se eliminó `docs/ADR/Security/` completo (5 ADR + README + archivo `_.tmp` suelto) y se sustituyó por un único ADR-012 con una línea base proporcionada: gestión de secretos ya aplicable, protección de prompt injection acotada a los dos UC reales, protección de datos de menores, y regla mínima de contraseñas — dejando explícitamente diferido (no descartado) el modelo RBAC/Vault completo como posible trabajo futuro si el proyecto escala a producción real.

**Output generado**: [docs/ADR/ADR-012_linea_base_seguridad.md](../../docs/ADR/ADR-012_linea_base_seguridad.md). Actualizado `.ai/AGENTS.md` (sección "Línea base de seguridad" apunta ahora a ADR-012 en vez del paquete eliminado).

---

## 2026-08-06 — Revisión de `.ai/skills/*.md` + referencias a ADR-012

**Input**: Solicitud de revisar si las 11 skills (`.ai/skills/`) están bien definidas. Se encontraron 5 problemas reales (no solo de estilo): (1) ruta `Architecture.md` mal escrita (debía ser `ARCHITECTURE.md`) repetida en varias skills y en `AGENTS.md`; (2) aparente contradicción entre `security.md` ("no introducir nuevas dependencias") y `ADR-012` (exige bcrypt/argon2) — descartada tras aclaración del usuario: Security Agent audita, Developer Agent implementa (sin esa restricción); (3) `reviewer.md` asume flujo de Pull Request pese a que el repo no está inicializado como git (`git status` verificado); (4) solape de `Salidas` entre `architecture.md` y `documentation.md` (ambas reclaman ADRs/ARCHITECTURE.md); (5) ejemplos de `knowledge-manager.md` desincronizados del código real (citan "ADR-003 Exercise Caching Strategy" inexistente, "Difficulty Calculator" en vez de `AdaptiveDifficultyEngine`, convención `.spec.ts` cuando el proyecto usa `.test.ts`).

**Contexto utilizado**: los 11 archivos de `.ai/skills/`, `.ai/AGENTS.md`, `ADR-012`, y verificación real con `git status` (no simulada).

**Decisión tomada**: (Punto 1, resuelto) 8 correcciones de `Architecture.md`→`ARCHITECTURE.md`. (Punto 2, resuelto por aclaración del usuario) sin cambio de código, solo se documentó la división de responsabilidades Security-audita/Developer-implementa directamente en `security.md`. Además, a petición explícita del usuario: se añadió referencia a `ADR-012` en las 11 skills (línea en `Restricciones`: "Debe respetar la línea base de seguridad (ADR-012)"), con tratamiento reforzado en `security.md` (también en `Entradas` y `Checklist`, más la aclaración de la división de responsabilidad con Developer Agent). Puntos 3, 4 y 5 quedan pendientes de confirmación del usuario, no resueltos todavía.

**Output generado**: `.ai/skills/{architecture,director,orchestrator,knowledge-manager}.md` (fix de ruta), `.ai/AGENTS.md` (fix de ruta), y las 11 skills en `.ai/skills/` con referencia a ADR-012 añadida.