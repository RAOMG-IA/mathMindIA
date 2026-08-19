# ADR-017: Trazabilidad estructurada y métricas del sistema de agentes

- **Estado:** Aceptado — migración retroactiva completa (86/86 entradas de `.ai/prompts/*.md` con front-matter, 0 sin migrar) y `npm run metrics -- --report` (`scripts/metrics/trazabilidad.ts`) genera los KPIs definidos en `docs/metrics/trazabilidad.md`.
- **Fecha:** 2026-08-10
- **Ámbito:** Gobierno del sistema multiagente (`.ai/AGENTS.md`), trazabilidad (`.ai/prompts/*.md`), `docs/STATUS.md`
- **Decisión:** Convertir la trazabilidad de prosa a datos: cada entrada de `.ai/prompts/*.md` pasa a llevar **front-matter YAML** con los campos `task_id`, `handoff_ref`, `agentes`, `flujo`, `artefactos`, `tests`, `estado` (y `rework_de` condicional), manteniendo el relato en prosa como cuerpo. Con esa estructura un script computa los KPIs que las skills definen pero nunca miden (ADR-002/AGENTS.md): % handoff completo, % con Reviewer/Security, tasa de retrabajo, cobertura de tests (declarada y real a futuro), huecos de trazabilidad. **Adenda 2026-08-10 (fusión de diseños)**: el usuario confirmó vía AskUserQuestion dos ajustes sobre el diseño original — (1) la migración es **retroactiva** (toda la historia, no solo entradas nuevas) para tener baseline de KPIs desde el día 1, y (2) la cobertura se mide en dos capas: **declarada** (contadores por entrada) ahora y **real de código** (`@vitest/coverage-v8`) como target futuro no bloqueante. Ambas están incorporadas en §3/§5/§6.

## Contexto

`.ai/AGENTS.md` define un flujo obligatorio (Product → Architecture → Test → Developer → Reviewer → Security → Documentation), un handoff estructurado de 8 campos y un sistema de trazabilidad por agente en `.ai/prompts/<agente>.md`. Las 11 skills de `.ai/skills/` definen secciones `## KPIs` (p. ej. orchestrator.md: "Tasa de retrabajo", "Número de tareas correctamente asignadas"; reviewer.md: "Defectos detectados") — pero **ninguna se mide**: los `.ai/prompts/*.md` son prosa libre no consultable.

Este hueco ya se materializó dos veces en la sesión (STATUS.md #28): Reviewer Agent **nunca se invocó** en todo el proyecto y Security solo una vez — ambos pese a que el flujo lo exige. No se detectó hasta que el usuario preguntó manualmente. Con trazabilidad estructurada, esa clase de hueco es un KPI automático, no un hallazgo manual.

Estado actual de los datos:
- `.ai/prompts/security.md`, `.ai/prompts/architecture.md`, etc.: secciones `## Fecha — Título` en prosa con campos en negrita (`**Contexto utilizado**`, `**Hallazgos**`, `**Decisión tomada**`, `**Output generado**`). Informativo pero no consultable.
- `docs/STATUS.md`: numeración de tareas `#N` — fuente natural de `task_id`.
- ADR-002 (referenciado en AGENTS.md como detalle del handoff) no existe como fichero en `docs/ADR/`; los 8 campos viven en `AGENTS.md`. Este ADR no crea ese fichero; solo lo referencia como contrato.

## Decisión

### 1. Formato de entrada con front-matter YAML

Cada entrada de `.ai/prompts/<agente>.md` comienza con un bloque YAML entre `---` (antes del `## Fecha — Título`), seguido del relato en prosa existente (que se conserva como cuerpo, sin reescribirlo):

```markdown
---
task_id: STATUS-042
date: 2026-08-10
handoff_ref: STATUS-042
agentes: [security]
flujo: [developer, reviewer, security]
artefactos: [apps/backend-api/src/presentation/http/corsConfig.ts]
tests: [npm run test:unit -- apps/backend-api]
cobertura: { verdes: 8, total: 8, nuevos: 8 }
estado: done
---
## 2026-08-10 — Revisión: CORS (`CORS_ALLOWED_ORIGINS`)
**Contexto utilizado**: ...
**Hallazgos**: ...
**Decisión tomada**: ...
```

**Campos obligatorios:** `task_id`, `date`, `agentes`, `flujo`, `estado`.

**Campos recomendados** (los que alimentan KPIs): `handoff_ref`, `artefactos`, `tests`.

**Campo condicional:** `rework_de` (obligatorio si `estado: rework`; valor = `task_id` de la tarea original que se retrabaja).

**Cardinalidad:** un `task_id` debe tener **una entrada en el fichero de cada agente que participó** — el join entre agentes se hace por `task_id`, no por fecha. `estado: rework` se registra en la entrada del agente que detecta la causa (normalmente Reviewer/Security), y `rework_de` une la tarea retrabajada con la original.

**`flujo` es propiedad de la tarea, no de la entrada:** todas las entradas de un mismo `task_id` declaran el mismo `flujo` (las fases realmente ejecutadas para la tarea completa, en orden del flujo obligatorio de AGENTS.md); `agentes` declara quiénes ejecutaron *esta* entrada. Invariante validada por el lint (§4): `agentes(entrada) ⊆ flujo(task_id)`. Así un `task_id` con tres entradas (p.ej. `architecture`, `developer`, `security`) suma su `flujo` real y se compara contra el flujo ideal sin depender de quién registró.

### 2. Esquema de campos

| Campo | Tipo | Oblig. | Semántica |
|---|---|---|---|
| `task_id` | `STATUS-<n>` | sí | Identificador canónico de la tarea en `docs/STATUS.md` (#N). Permite unir entradas de distintos agentes. |
| `date` | `YYYY-MM-DD` | sí | Fecha de la entrada. |
| `agentes` | lista | sí | Agentes que ejecutaron **esta** entrada (p. ej. `[security]`). |
| `flujo` | lista | sí | Fases realmente ejecutadas para el `task_id` completo, en orden del flujo obligatorio (AGENTS.md). Mismo valor en todas las entradas del `task_id`; `agentes ⊆ flujo`. Vocabulario del flujo: `product, architecture, test, developer, reviewer, security, documentation` (+ `director, orchestrator, knowledge` cuando participan). Alimenta `con_reviewer%`, `con_security%`, `adherencia_flujo%`, `cobertura_agentes` (§3). |
| `handoff_ref` | texto | rec. | Referencia al handoff de 8 campos (AGENTS.md, adenda 2026-08-07). |
| `artefactos` | lista | rec. | Ficheros que toca/genera la entrada (rutas repo). |
| `tests` | lista | rec. | Comandos de test aplicables (no outputs, no secretos). |
| `cobertura` | objeto | rec. | Contadores de tests declarados por la entrada (`{verdes, total, nuevos?}`); alimenta `cobertura_declarada%` (§3). Ausente si la entrada no toca tests (p.ej. UI visual, wiring). |
| `estado` | `done\|rework\|blocked` | sí | Resultado de la tarea para este agente. |
| `rework_de` | `STATUS-<n>` | cond. | Solo si `estado: rework`. |

### 3. KPIs computables (definición, no instrumentación)

Con `T = {task_id con ≥1 entrada}`:

1. **`handoff_completo%`** = `|{t ∈ T : t tiene handoff_ref}| / |T|` — mide si el handoff de 8 campos se registró.
2. **`con_reviewer%`** = `|{t ∈ T : reviewer ∈ flujo(t)}| / |T|` — detecta la clase de hueco #28 (Reviewer nunca invocado).
3. **`con_security%`** = `|{t ∈ T : security ∈ flujo(t)}| / |T|` — idem para Security.
4. **`adherencia_flujo%`** = `|{t ∈ T : flujo(t) == flujo_obligatorio completo}| / |T|` — flujo completo vs. parcial.
5. **`tasa_retrabajo%`** = `|{t ∈ T : estado(t) = rework}| / |T|`; **`rework_por_agente`** = distribución de `rework_de` por agente que detecta (Reviewer vs Security vs Test...).
6. **`cobertura_tests%`** = `|{t ∈ T : tests(t) no vacío}| / |T|`.
7. **`cobertura_declarada%`** = `|{t ∈ T : cobertura(t) definido ∧ cobertura(t).verdes == cobertura(t).total}| / |{t ∈ T : cobertura(t) definido}|`; agregado `Σ verdes / Σ totales` — sobre el agregado se evalúa el umbral >90% del Test Agent. Es **auto-reportada** (riesgo en §Consecuencias); se contrasta contra `turbo run test` y, a futuro, contra la cobertura real.
8. **`cobertura_real%`** = cobertura de código real por paquete con `@vitest/coverage-v8` — **target futuro**, declarado aquí, no instrumentado en esta fase (§6).
9. **`huecos_trazabilidad`** = `{task_id en STATUS.md sin ninguna entrada en .ai/prompts/*}` — el KPI que habría pillado #28 automáticamente.
10. **`cobertura_agentes`** = para cada agente, `|tareas con entrada| / |tareas donde debía participar según flujo|` — mide cumplimiento del RACI por rol.

**Definición de "tarea completa" para los denominadores:** tarea cerrada (marcada como completada/verificada en STATUS.md). Las tareas en curso no entran en los KPIs de cobertura.

### 4. Mecánica de cómputo

- **Un único script** `scripts/metrics/trazabilidad.ts` (tsx, mismo patrón que `ingestKnowledgeBase.ts`), con modos por subcomando — **la opción más simple sin perder opciones**: una sola herramienta, una sola lógica de parseo, cero dependencias nuevas, y todos los controles del diseño disponibles:
  - `trazabilidad.ts` (por defecto): parsea los `.ai/prompts/*.md`, extrae el front-matter (parser propio de subconjunto YAML de clave-valor/lista — **sin dependencia nueva** de YAML, coherente con la sobriedad de dependencias del repo), cruza con `docs/STATUS.md`, y emite en consola la tabla de KPIs por agente y por tarea.
  - `trazabilidad.ts --report`: además, escribe `docs/metrics/trazabilidad.md` con el reporte versionado.
  - `trazabilidad.ts --lint` (el "pre-flight" de trazabilidad que hoy no existe): falla si una entrada nueva no tiene front-matter válido (campos obligatorios), si se viola la invariante `agentes ⊆ flujo`, o si un `task_id` de una tarea cerrada no tiene entradas en los agentes que su `flujo` exige — rechaza la tarea sin registro. Este modo absorbe al `lint-trazabilidad.ts` separado del diseño original: misma validación, un solo fichero.
  - El parser se mantiene deliberadamente mínimo; si algún día hiciera falta YAML completo, se sustituye por `js-yaml` sin cambiar ni el esquema ni los modos (§Consecuencias).
- Sin CI por ahora (ADR-016: CI/CD fuera de alcance en esta fase) — el script se ejecuta a demanda o al cerrar una fase (`--lint`).

### 5. Migración

- **Retroactiva (adenda 2026-08-10, elección del usuario):** la historia completa de `.ai/prompts/*.md` (~50 entradas) se migra al front-matter para tener baseline de KPIs desde el día 1. Procedimiento (fase de implementación, Developer/DevOps): asignar `task_id` `STATUS-<n>` según la numeración de `docs/STATUS.md`, clasificar `agentes`/`flujo`/`artefactos`/`tests`/`cobertura` desde la prosa (los `**Output generado**` ya enumeran rutas; los `**Verificado...**` ya dan conteos de tests), y `handoff_ref`/`rework_de` donde la prosa lo evidencie (los 3 handoffs reales de `orchestrator.md` → `STATUS-<n>` correspondientes). Los campos que la prosa no permita clasificar con evidencia se marcan `no declarado` y cuentan como hueco de calidad — no se inventa.
- **Desde la aceptación de este ADR:** toda entrada nueva en `.ai/prompts/*.md` lleva front-matter obligatorio, validado por el lint (§4).
- **Exemplares:** se migran a front-matter las 2-3 entradas más recientes de cada fichero y las de registro de este propio ADR (`documentation.md`/`architecture.md`), que sirven de plantilla viva del formato.
- El relato en prosa se conserva íntegro como cuerpo — el front-matter solo añade datos, no sustituye narrativa.

### 6. Coherencia con la línea base de seguridad (ADR-012)

- El front-matter es dato escalar y **nunca contiene valores de secretos** (ADR-012 §5): `tests` referencia comandos, `artefactos` rutas, `handoff_ref` identificadores — solo nombres de variable, nunca valores.
- Ningún dato identificativo de menores (ADR-012 §3): la trazabilidad no incluye emails ni datos de usuario.
- El formato estructurado reduce el riesgo que la prosa libre tenía de colar literales sensibles en el relato (más fácil auditar campos escalares que párrafos).

## Consecuencias

### Positivas

- **Gobernanza medible**: los KPIs que las skills definen pasan a computarse — material académico diferencial (gobierno de agentes medido, no solo descrito).
- **Detección automática de huecos de proceso**: la clase de fallo #28 (Reviewer/Security nunca invocados) se vuelve un número, no un hallazgo manual.
- **Join entre agentes por `task_id`**: correlacionar qué pasó con cada tarea en cada fase deja de ser búsqueda manual en 8 ficheros.
- **Retrabajo medible y atribuible**: `rework_de` + agente que detecta permite ver qué fase produce más retrabajo y por qué.
- **Sin dependencias nuevas**: parser propio del subconjunto YAML, script en el patrón tsx ya usado por el proyecto.

### Negativas / Riesgos

- **Coste por entrada**: el front-matter es fricción adicional por tarea; se mitiga con la plantilla y el lint (solo exige campos obligatorios).
- **Disciplina**: si una entrada se escribe sin front-matter, el lint lo pilla (protección), pero el valor de los KPIs depende de que el campo `flujo` se rellene con honestidad.
- **Migración retroactiva con juicio humano**: clasificar `agentes`/`flujo`/`artefactos` del histórico puede equivocarse; se mitiga con la validación del lint y marcando lo no evidente como `no declarado` (deuda de calidad contabilizada, no oculta).
- **Cobertura declarada auto-reportada**: los conteos de `cobertura` provienen de la entrada, no de una medición objetiva — riesgo de gaming. Mitigado con el cross-check contra `turbo run test` y, a futuro, con `cobertura_real%` (`@vitest/coverage-v8`), que es objetiva; por eso se fija como target, no como opción descartada.
- **Parser propio**: subconjunto YAML limitado (sin anclajes/objetos anidados); si algún día se necesitara YAML completo, sustituible por `js-yaml` sin cambiar el esquema.

## Fuera de alcance

- Implementar `scripts/metrics/trazabilidad.ts` (modos por defecto/`--report`/`--lint`) y la **migración retroactiva** — ciclo TDD posterior (Test Agent → Developer Agent → Reviewer/Security → Documentation), no de este ADR. En esta fase solo se migran los exemplares (§5).
- Cobertura real de código con `@vitest/coverage-v8` (`cobertura_real%`, §3) — target declarado, no instrumentado.
- Dashboards/visualización o integración con herramientas externas (Linear/JIRA/CI).
- Métricas de uso del producto MathMind AI — esto mide el sistema de **agentes**, no el producto.
- Almacenamiento de datos personales de usuarios en la trazabilidad (ADR-012 §3).

## Trazabilidad

Registrado en `.ai/prompts/documentation.md` (formato de este ADR como primer exemplar del front-matter) y `.ai/prompts/architecture.md`.
