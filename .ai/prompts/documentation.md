# Documentation Agent
Maintain README, Architecture, ADRs and diagrams.

---

---
task_id: STATUS-052
date: 2026-08-10
handoff_ref: STATUS-052
agentes: [architecture, documentation]
flujo: [architecture, documentation]
artefactos: [docs/ADR/ADR-017_trazabilidad_y_metricas.md]
estado: done
---
## 2026-08-10 — ADR-017: Trazabilidad estructurada y métricas

**Input**: el usuario pidió diseñar un ADR para convertir la trazabilidad de prosa a datos (front-matter YAML por entrada: task_id, handoff_ref, agentes, artefactos, tests) y poder computar los KPIs que las skills definen pero nunca miden.

**Contexto utilizado**: `.ai/AGENTS.md` (flujo obligatorio, handoff de 8 campos, línea base de seguridad), `.ai/prompts/{security,documentation}.md` (formato de trazabilidad actual en prosa), `.ai/skills/*.md` (secciones `## KPIs`), `docs/STATUS.md` (numeración `#N` como fuente de `task_id`), ADR-012 (secretos nunca en trazabilidad), ADR-016 (CI/CD fuera de alcance).

**Decisión tomada**: formato front-matter YAML por entrada (campos `task_id`, `date`, `agentes`, `flujo`, `estado` obligatorios; `handoff_ref`/`artefactos`/`tests`/`cobertura` recomendados; `rework_de` condicional; invariante `agentes ⊆ flujo`), 10 KPIs definidos con fórmulas, **un único script** `scripts/metrics/trazabilidad.ts` sin dependencia nueva (modos: KPIs por defecto, `--report`, `--lint` pre-flight), migración **retroactiva** de toda la historia + entradas nuevas obligatorias + exemplares, cobertura en dos capas (**declarada** por entrada ahora, **real** con `@vitest/coverage-v8` como target futuro), y coherencia explícita con ADR-012 (sin secretos ni datos de menores en el front-matter). Adenda 2026-08-10: fusión sobre este ADR de las decisiones del usuario (retroactividad y cobertura), que el diseño original del pipeline no incluía.

**Output generado**: `docs/ADR/ADR-017_trazabilidad_y_metricas.md`. Esta entrada usa el formato del ADR como primer exemplar del front-matter (ADR-017 §5).

---

---
task_id: STATUS-028
date: 2026-08-07
agentes: [documentation]
flujo: [developer, reviewer, security, documentation]
estado: done
---

## 2026-08-07 — Reconocimiento: documentación al día, registro formal ausente hasta ahora

**Input**: al revisar por qué Reviewer/Security nunca se habían invocado (ver `.ai/prompts/{reviewer,security}.md`), se detectó que este archivo tampoco tenía ninguna entrada — pese a que `docs/STATUS.md` y los READMEs de cada paquete/módulo sí se han actualizado en cada tarea de esta sesión (backend real, QwenClient, los 6+3 Casos de Uso, etc.).

**Contexto utilizado**: `.ai/AGENTS.md` (Documentation Agent como fase del flujo obligatorio, aunque su ausencia de registro es un hueco menor comparado con Reviewer/Security — el contenido documental sí existe y está actualizado).

**Decisión tomada**: no se retrabaja documentación ya escrita (sería redundante). Se deja constancia de que, de aquí en adelante, las actualizaciones de `STATUS.md`/READMEs deben registrarse también aquí como su propia entrada, no solo mencionarse dentro de las entradas de Architecture/Test/Developer.

**Output generado**: esta entrada.