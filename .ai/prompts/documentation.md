# Documentation Agent
Maintain README, Architecture, ADRs and diagrams.

---

---
task_id: STATUS-065
date: 2026-08-22
agentes: [documentation]
flujo: [director, documentation]
artefactos: [README.md]
estado: done
---

## 2026-08-22 — Auditoría de README.md contra el checklist de entrega del TFM

**Input**: el usuario (Project Director) pidió comprobar que `README.md` cubre 6 puntos exigidos por la entrega del TFM: (a) descripción general, (b) stack tecnológico, (c) instalación y ejecución, (d) estructura del proyecto, (e) funcionalidades principales, (f) usuario/contraseña de prueba.

**Auditoría (antes de tocar nada)**: `README.md` seguía siendo, en gran parte, el documento de **diseño inicial** del proyecto (hasta decía en "Estado del Proyecto": *"Fase actual: Diseño del sistema"*, escrito antes de que existiera una sola línea de código real). Hallazgos por punto:
- (a) presente pero sin mencionar el propio sistema multiagente, que es el segundo objeto de estudio real del TFM.
- (b) presente pero desactualizado: sin Prisma/pgvector/Zod/AWS/EAS; "Modelo Qwen" cuando el cliente es agnóstico de proveedor desde hace semanas; Redis descrito en futuro ("actuará como caché") sin aclarar que sigue sin consumidor de código.
- (c) **ausente por completo** — cero instrucciones de instalación, variables de entorno o arranque.
- (d) árbol de estructura sin `.ai/` (la gobernanza del TFM), `deploy/`, `.github/workflows/` ni `docker/`.
- (e) sin mencionar login/registro/invitado/logout (US-001/002/009/010, todas ya implementadas), estadísticas ni RAG; "Logros y retos futuros" prometía una funcionalidad (`Achievement`) nunca construida.
- (f) **ausente por completo**.

**Decisión tomada**: reescritura de `README.md` completa. Añadidas dos secciones nuevas ("Instalación y Ejecución", verificada contra `docker-compose.yml`/`.env.example`/scripts reales de cada `package.json`, no inventada; "Usuario y contraseña de prueba") y corregidas (e)/(b)/(d) contra el código real. Para (f): no existe ni se crea un usuario/contraseña fijo publicado — se documenta el botón "Prueba sin registrarte" (US-009, construido explícitamente para este propósito) como vía recomendada, más la alternativa de autorregistro; publicar una credencial fija en el repo habría sido un antipatrón de seguridad sin necesidad real. **Hallazgo colateral corregido**: la cifra "18 ADR en estado Aceptado" (heredada sin verificar de `docs/TFM_PRESENTACION_GOBERNANZA.md`/`TFM_PRESENTACION_CONTENIDO.md`) no cuadra con el recuento real (`ls docs/ADR*`: 14 ficheros, los 14 en estado Aceptado) — corregida a 14 en `README.md`; **no** corregida en los documentos de la presentación (fuera del alcance de esta tarea), señalado al usuario para que decida.

**Output generado**: `README.md` reescrito.

**Adenda (misma fecha)**: el usuario pidió corregir también la presentación. Actualizado el generador (`build.js`, fuera del repo) y regenerado `docs/TFM_Presentacion.pptx` + `docs/TFM_PRESENTACION_CONTENIDO.md`: "18/18 ADR" → "14/14 ADR" (slide 20, Conclusiones). De paso, mismo hallazgo en la cifra vecina de la misma frase: "7/7 User Stories" también estaba desactualizado (US-008/009/010 no existían cuando se escribió) — corregido a "10/10 User Stories" en slides 4 y 20 y en `CONTENIDO.md`, sin que el usuario lo pidiera explícitamente pero por ser el mismo tipo de error en el mismo sitio. Verificado visualmente con PowerPoint vía COM tras regenerar.

**Adenda 2 (2026-08-22)**: el usuario preguntó por qué falla `npm run metrics`. Diagnóstico: `npm run metrics` (sin argumentos) no falla — el que falla por diseño (exit 1) es `npm run metrics -- --lint`, con 23 violaciones reales en ese momento. 18 son deuda preexistente (entradas de 2026-08-11/12 en `developer.md`/`security.md` sin front-matter, anteriores a esta sesión). Las otras 5 eran un fallo propio recién introducido: las 6 entradas de `STATUS-064` (US-010) usaban 3 valores de `flujo` distintos (`[director, product]` en `product.md`, `[director, product, architecture]` en `architecture.md`, y `[product, architecture, test, developer, reviewer, security, documentation]` en `test.md`/`developer.md`/`reviewer.md`/`security.md`) — viola el invariante de ADR-017 (`flujo` es propiedad de la tarea completa, no de cada entrada). Normalizadas las 6 al mismo valor (`[director, product, architecture, test, developer, reviewer, security, documentation]`). `--lint` pasa de 23 a 18 violaciones (todas ya preexistentes, sin tocar). `docs/metrics/trazabilidad.md` regenerado con `--report`.

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