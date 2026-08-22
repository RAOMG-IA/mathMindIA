# MathMind AI — Gobernanza de un Sistema Multiagente de IA para Desarrollo de Software

**Documento de formalización para la presentación del TFM**
Máster en Desarrollo de Software Potenciado con IA
Autor: Rubén Abad

> Este documento reúne, con evidencia extraída directamente del propio repositorio (ADRs, `docs/STATUS.md`, bitácoras de trazabilidad `.ai/prompts/`, historial de commits y métricas generadas), la gobernanza de agentes, los procedimientos, las buenas prácticas y los errores cometidos durante el desarrollo de MathMind AI. Está redactado para servir de base directa a la generación de un conjunto de diapositivas: cada apartado `##` está pensado como una diapositiva o un bloque de 2-3 diapositivas (ver Anexo C).

---

## Índice

1. [Contexto y objetivo del TFM](#1-contexto-y-objetivo-del-tfm)
2. [Diseño de la gobernanza: jerarquía y agentes](#2-diseño-de-la-gobernanza-jerarquía-y-agentes)
3. [Reglas transversales del sistema](#3-reglas-transversales-del-sistema)
4. [Procedimientos: cómo se controla que el sistema cumpla su propio diseño](#4-procedimientos-cómo-se-controla-que-el-sistema-cumpla-su-propio-diseño)
5. [Métricas de gobernanza: resultados reales medidos](#5-métricas-de-gobernanza-resultados-reales-medidos)
6. [Buenas prácticas aplicadas](#6-buenas-prácticas-aplicadas)
7. [Errores cometidos e incidentes (evidencia real)](#7-errores-cometidos-e-incidentes-evidencia-real)
8. [Patrones de aprendizaje transversales](#8-patrones-de-aprendizaje-transversales)
9. [Línea de tiempo del proyecto](#9-línea-de-tiempo-del-proyecto)
10. [Conclusiones](#10-conclusiones)
11. [Anexo A — Glosario de agentes](#anexo-a--glosario-de-agentes)
12. [Anexo B — Fuentes documentales citadas](#anexo-b--fuentes-documentales-citadas)
13. [Anexo C — Propuesta de estructura de slides](#anexo-c--propuesta-de-estructura-de-slides)

---

## 1. Contexto y objetivo del TFM

**Producto**: MathMind AI, plataforma de aprendizaje adaptativo de cálculo mental (Primaria, Secundaria, Bachillerato, Ingeniería), con Modo Test y Modo Resolución, motor de dificultad adaptativa y generación de contenido con IA (`README.md`).

**El verdadero objeto de estudio del TFM no es solo la app, sino el propio proceso**: MathMind AI se construye con un **sistema multiagente de IA especializado por rol**, gobernado por un conjunto de reglas explícitas (`.ai/AGENTS.md`) y documentado formalmente mediante Architecture Decision Records (ADRs). El objetivo académico es doble:

1. Demostrar que es posible gobernar un desarrollo de software real con agentes de IA especializados, siguiendo Clean Architecture, TDD y SDD de forma verificable.
2. **Medir**, no solo describir, el grado real de cumplimiento de esa gobernanza — y documentar honestamente dónde falló, por qué, y qué mecanismo se introdujo para corregirlo.

**Estrategia de uso de la IA generativa** (`README.md`, "Estrategia de Inteligencia Artificial"): la IA no participa en cada petición del usuario final. Los ejercicios se generan en procesos batch previos y se almacenan en base de datos; la IA se reserva para generación masiva de contenido, pistas y explicaciones. Decisión motivada por coste, latencia y escalabilidad — no solo por conveniencia técnica.

---

## 2. Diseño de la gobernanza: jerarquía y agentes

### 2.1 Principio fundamental

> "Los agentes NO son asistentes independientes. Forman parte de un sistema coordinado donde cada agente tiene responsabilidades específicas y limitadas." — `.ai/AGENTS.md`

### 2.2 Jerarquía de decisión (agentes estratégicos)

```text
Usuario → Project Director → Project Orchestrator → Knowledge Manager → Agentes Operativos
```

| Agente | Rol |
|---|---|
| **Project Director** | Interactúa con el usuario, refina requisitos, optimiza prompts y contexto, conserva la intención funcional original. |
| **Project Orchestrator** | Descompone tareas, asigna agentes participantes, controla dependencias, resuelve conflictos entre agentes. |
| **Knowledge Manager** | Recupera contexto del proyecto, localiza documentación relevante, detecta duplicidades y conflictos arquitectónicos, garantiza coherencia entre decisiones. |

**Knowledge First Rule**: ningún agente operativo puede iniciar trabajo sin contexto proporcionado por el Knowledge Manager — mecanismo diseñado explícitamente contra "uno de los principales problemas de los sistemas multiagente: la deriva de contexto entre agentes" (comentario literal en `.ai/AGENTS.md`).

### 2.3 Agentes operativos (flujo obligatorio de desarrollo)

```text
Product → Architecture → Test → Developer → Reviewer → Security → Documentation
```

> "Ninguna fase puede omitirse." — `.ai/AGENTS.md`

| Agente | Objetivo | Responsabilidades | Restricción explícita |
|---|---|---|---|
| **Product** | Transformar necesidades funcionales en requisitos verificables | User Stories, backlog, roadmap, criterios de aceptación, casos de uso funcionales | — |
| **Architecture** | Diseñar la solución técnica | Diagramas, ADRs, interfaces, modelado de dominio | — |
| **Test** | Garantizar cumplimiento estricto de TDD | Unit/Integration tests, fixtures, builders, mocks | **No puede implementar código productivo**; debe actuar antes del Developer |
| **Developer** | Implementar funcionalidades | Desarrollo, refactorización, integración | **No puede crear código sin tests previos**; debe respetar Clean Architecture y contratos ya definidos |
| **Reviewer** | Última barrera de calidad antes de seguridad | Revisión funcional, arquitectónica, de complejidad, mantenibilidad, naming | Valida cumplimiento de requisitos/arquitectura/TDD y ausencia de deuda técnica evidente |
| **Security** | Garantizar seguridad de la solución | OWASP Top 10, gestión de secretos, hardening, dependencias vulnerables | Valida Input Validation, Authentication, Authorization, Rate Limiting, Dependency/Secret Scan |
| **Documentation** | Mantener documentación viva | README, ARCHITECTURE.md, ADRs, diagramas, changelog | Toda modificación relevante debe reflejarse en documentación |
| **DevOps** | Automatización y despliegue | Docker, Docker Compose, GitHub Actions, CI/CD, observabilidad, entornos | — |

**Decisión de diseño explícita — eliminación del QA Agent** (`ADR-002`): no existe como agente independiente; sus funciones quedan repartidas entre Product, Test, Reviewer y Security, para no duplicar responsabilidades de calidad ya cubiertas.

### 2.4 Matriz RACI (extracto, `.ai/AGENTS.md`)

| Actividad | Director | Orchestrator | Knowledge | Product | Arch | Test | Dev | Review | Sec | Doc | DevOps |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Historias de usuario | A | I | C | **R** | C | I | I | I | I | I | I |
| Diseño arquitectura / ADRs | I | C | C | I | **A** | I | I | I | I | R | I |
| Unit/Integration Tests | I | I | I | I | C | **A** | I | I | I | I | I |
| Implementación | I | C | C | I | C | C | **A** | I | I | I | I |
| Code Review | I | I | I | I | C | C | C | **A** | I | I | I |
| OWASP / Dependency Review | I | I | I | I | C | C | C | C | **A** | I | I |
| README / ARCHITECTURE.md / ADRs | I | I | C | I | C | I | I | I | I | **A** | I |
| Docker / CI/CD / Deploy | I | I | I | I | C | I | I | I | C | I | **A** |

(R = Responsable, A = Aprueba, C = Consultado, I = Informado)

---

## 3. Reglas transversales del sistema

Cuatro reglas de gobierno, aplicables a **todos** los agentes por igual, no específicas de ningún rol:

1. **Jerarquía Documental** — todo agente consulta en este orden de prioridad ante conflicto: `ADR > ARCHITECTURE.md > README.md > Skills > Prompt recibido`. Un ADR siempre prevalece sobre una instrucción puntual.
2. **Regla de Oro** — ningún agente puede generar, modificar o aprobar código sin haber consultado previamente ARCHITECTURE.md, README.md, los ADRs relevantes y sus skills asociadas.
3. **TDD Enforcement Rule** — "la metodología TDD forma parte de la arquitectura del sistema": ninguna implementación puede comenzar sin que existan Historia de Usuario, Diseño Arquitectónico y Casos de Prueba. Flujo: `User Story → Diseño → Tests → Implementación → Refactorización`.
4. **Reglas de Reutilización** — antes de crear cualquier artefacto nuevo debe comprobarse su existencia reutilizable en `packages/shared-{domain,types,utils,testing,config,constants}`. Prohibido duplicar entidades, DTOs, utilidades, constantes o configuraciones.

**Prohibiciones arquitectónicas explícitas** (`.ai/AGENTS.md`): dependencias circulares, lógica de negocio en Controllers o en componentes React, acceso directo a infraestructura desde UI, duplicación de lógica, secretos hardcodeados.

**Línea base de seguridad transversal** (`ADR-012`, referenciada desde `.ai/AGENTS.md`): gestión de secretos solo por variables de entorno (nunca en código/ADRs/trazabilidad); protección frente a prompt injection en los únicos dos puntos donde el sistema construye prompts hacia el LLM (generación de ejercicios y de pistas); mínimo dato necesario y ningún dato identificativo de menores en esos prompts; contraseñas nunca en texto plano; ningún agente de desarrollo salvo Security/DevOps accede a `.env` reales.

---

## 4. Procedimientos: cómo se controla que el sistema cumpla su propio diseño

Este es el bloque más citable académicamente: **el diseño de gobernanza no se limitó a describirse — se corrigió en directo cuando se demostró que no se cumplía**, y esa corrección quedó documentada como parte del propio proceso.

### 4.1 Contrato de Handoff obligatorio (adenda a `ADR-002`, 2026-08-07)

**Motivación literal del ADR**:

> "Verificado en la práctica que la jerarquía de decisión (...) y el flujo obligatorio (...) definidos arriba no se estaban siguiendo: ninguna tarea pasó realmente por Director/Orchestrator/Knowledge Manager, y Reviewer/Security se saltaron en la implementación de autenticación real (...). El problema no era que el flujo estuviera mal diseñado — era que no existía ningún punto de control que impidiera saltárselo."

**Mecanismo introducido**: todo cambio que no sea un fix trivial de una línea debe llevar, antes de ejecutarse, un handoff con 8 campos obligatorios:

```yaml
handoff:
  requester: ""        # quién origina la tarea
  objective: ""        # finalidad y resultado esperado
  scope: ""             # alcance y límites
  constraints: []       # restricciones técnicas/arquitectónicas/seguridad/negocio
  references: []        # ADRs, casos de uso, historias de usuario relacionadas
  acceptance: []        # criterios de aceptación verificables
  risks: []             # riesgos o bloqueantes conocidos
  required_agents: []   # agentes que deben intervenir
```

`required_agents` es por defecto el flujo obligatorio completo; omitir un agente exige justificación explícita dentro del propio handoff (p. ej. *"Security no aplica: cambio de solo documentación"*), nunca un silencio que se descubre después.

**Regla de validación**: el Orchestrator (o el Director en tareas pequeñas) valida los 8 campos antes de ejecutar. Si falta uno, la tarea se devuelve al emisor sin avanzar.

**Distinción clave con la trazabilidad** (§4.2): el handoff es el contrato de *entrada* (qué se pide); la trazabilidad documenta la *salida* (qué se hizo). Son complementarios, no redundantes.

### 4.2 Sistema de trazabilidad: de la prosa libre al dato medible

**Origen — ADR-003 (regla original)**: cada agente registra en `.ai/prompts/<agente>.md` una entrada en prosa con Input / Contexto utilizado / Decisión tomada / Output generado. El propio ADR ya reconocía su límite de diseño: *"la disciplina de registro es manual, no forzada por tooling"*.

**Evolución — ADR-017 (2026-08-10), "Trazabilidad estructurada y métricas del sistema de agentes"**: cada entrada de prosa se antepone con un front-matter YAML machine-readable, **sin sustituir el texto libre**:

```yaml
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
```

- **`task_id` = `STATUS-<n>`**: enlaza con la numeración `#N` de `docs/STATUS.md`; permite unir en una sola tarea las entradas de todos los agentes que participaron.
- Invariante validada por lint: `agentes(entrada) ⊆ flujo(task_id)` — el flujo es propiedad de la tarea completa, no de cada entrada individual.
- Modos del script (`scripts/metrics/trazabilidad.ts`, `npm run metrics`): tabla en consola por defecto; `--report` genera `docs/metrics/trazabilidad.md` versionado; `--lint` es un pre-flight que **falla con exit code 1** si falta front-matter, se viola la invariante, o una tarea cerrada de `STATUS.md` no tiene ninguna entrada asociada.

**Por qué este cambio es en sí mismo una lección de gobernanza**:

> "Este hueco ya se materializó dos veces en la sesión (`STATUS.md` #28): Reviewer Agent nunca se invocó en todo el proyecto y Security solo una vez (...). No se detectó hasta que el usuario preguntó manualmente. Con trazabilidad estructurada, esa clase de hueco es un KPI automático, no un hallazgo manual." — `ADR-017`

Diagnóstico de fondo documentado en el mismo ADR: *"Las 11 skills de `.ai/skills/` definen secciones `## KPIs` (...) pero ninguna se mide: los `.ai/prompts/*.md` son prosa libre no consultable."* — es decir, se pasó de una **gobernanza descrita** (KPIs definidos en el diseño de cada skill) a una **gobernanza medida** (KPIs calculados automáticamente sobre datos reales).

**Riesgo reconocido por el propio ADR**: la cobertura de tests se auto-reporta por el agente que ejecuta la tarea ("cobertura declarada"), no se mide sobre el código ("cobertura real", instrumentación con `@vitest/coverage-v8` declarada como *target futuro, no bloqueante*) — riesgo explícito de *gaming*, mitigado por contraste manual contra `turbo run test`.

**Decisión de alcance confirmada con el usuario**: la migración del front-matter fue **retroactiva** sobre ~50 entradas históricas, no solo sobre las nuevas — *"para tener baseline de KPIs desde el día 1"*.

---

## 5. Métricas de gobernanza: resultados reales medidos

Datos del último reporte generado (`docs/metrics/trazabilidad.md`, `npm run metrics -- --report`, ejecutado 2026-08-11): **86 entradas de trazabilidad analizadas, agrupadas en 49 tareas (`task_id`) distintas.**

| KPI | Qué mide | Valor medido |
|---|---|---|
| % tareas con handoff estructurado | Registro del contrato de 8 campos | **8,2%** (4/49) |
| % tareas con Reviewer en el flujo | Paso real por revisión de calidad | **4,1%** (2/49) |
| % tareas con Security en el flujo | Paso real por revisión de seguridad | **16,3%** (8/49) |
| Adherencia al flujo completo (7 fases) | Cumplimiento íntegro Product→...→Documentation | **0,0%** (0/49); solape medio 25,4% |
| Tasa de retrabajo | Tareas marcadas `estado: rework` | **0,0%** (0/49) |
| Cobertura de tests declarados | Tareas con comando de test registrado | **0,0%** (0/49) |
| Huecos de trazabilidad | Tareas de `STATUS.md` sin ninguna entrada de agente | **1** (`STATUS-018`) |

**Cobertura de agentes** (tareas con entrada real / tareas donde el flujo lo exigía):

| Agente | Cumplimiento |
|---|---|
| Product | 100,0% (2/2) |
| Developer | 92,9% (26/28) |
| Architecture | 92,3% (24/26) |
| Security | 87,5% (7/8) |
| Test | 88,2% (15/17) |
| **Documentation** | **50,0% (2/4)** |
| **Reviewer** | **50,0% (1/2)** |

**Lectura honesta para el TFM**: la propia instrumentación demuestra que, *incluso después* de introducir el Contrato de Handoff (§4.1), el flujo obligatorio de 7 fases **nunca se cumplió completo en ninguna tarea real del proyecto**, y Reviewer sigue siendo el eslabón más débil de la gobernanza (4,1% de las tareas totales, 50% cuando el flujo sí lo exigía explícitamente). Esta brecha entre **política declarada** (`.ai/AGENTS.md`) y **comportamiento medido** es, en sí misma, el resultado empírico más relevante del TFM sobre gobernanza de sistemas multiagente: describir un proceso no garantiza que se siga, y solo medirlo permite saberlo con certeza.

---

## 6. Buenas prácticas aplicadas

1. **ADRs vivos, no estáticos** — las decisiones no se reescriben, se **enmiendan con adendas fechadas** dentro del mismo documento (ADR-002 adenda 2026-08-07, ADR-003 adenda por ADR-017, ADR-015 corregida en la misma tarea, ADR-001 adenda Zod). Esto conserva el razonamiento original y la corrección posterior como evidencia histórica, en vez de borrar el error.
2. **Separación de documentos mutables vs. estables** (`ADR-000`) — el estado de avance vive en `STATUS.md` (cambia semana a semana); las decisiones arquitectónicas viven en ADRs (estables una vez aceptadas). Evita ruido en el historial de decisiones.
3. **TDD real, no nominal** — ciclo Red→Green→Refactor aplicado desde el primer componente de dominio (`AdaptiveDifficultyEngine`); el Test Agent tiene prohibido explícitamente escribir código productivo, forzando la separación de responsabilidades.
4. **Validación de contratos de IA en el borde, no confianza ciega** — Zod valida la *forma* de la respuesta del LLM antes de usarla (adenda ADR-001); patrón repetido tras el incidente de tipos `number`/`string` (§7, punto 11) con una función `stringifiableValue` explícita — coaccionar en el borde en vez de asumir que el LLM respeta el contrato pedido.
5. **Reutilización obligatoria vía `packages/shared-*`** — regla explícita contra duplicar entidades, DTOs, utilidades o constantes; verificable por Grep antes de crear cualquier artefacto nuevo.
6. **Neutralidad de proveedor de IA** — nombres de variables/clases sin atarse a un proveedor concreto (`QwenClient`→`IAClient`, variables `QWEN_*` renombradas), permitiendo cambiar de modelo generativo sin romper contratos internos.
7. **Aislar en vez de bloquear** — incidentes de entorno (Windows: rutas, binarios nativos, symlinks de Metro) se resuelven documentando el workaround y aislando el test afectado (`--exclude`), sin detener el resto del pipeline de CI.
8. **Diagnóstico por capas antes de tocar código** — ante síntomas ambiguos (402 de facturación de un proveedor de IA, URL mal configurada, bug "siempre el mismo ejercicio") se verifica primero con herramientas externas (`curl`, `psql`) antes de modificar código, evitando corregir la causa equivocada.
9. **Gestión explícita de deuda técnica aceptada** — adaptadores que hablan con red/hardware real (LLM, Prisma, almacenamiento nativo) se documentan como "gap explícito sin test automático" en vez de simularse con mocks que no demostrarían nada real; contrastado deliberadamente con los casos donde sí se exige infraestructura real en los tests (Postgres real, pgvector end-to-end) porque "moqueado no puede demostrar persistencia real".
10. **Reevaluación tecnológica documentada, no silenciosa** — sustitución de Chroma por pgvector, descarte de `@langchain/community`, sustitución de un paquete completo de 5 ADRs de seguridad sobredimensionados por un único `ADR-012` más realista: todas las reversiones de decisión previa quedan registradas con su motivo, no ocultas.

---

## 7. Errores cometidos e incidentes (evidencia real)

### 7.1 Errores de gobernanza del propio sistema multiagente

| # | Incidente | Causa raíz | Solución |
|---|---|---|---|
| 1 | **Reviewer Agent nunca invocado en todo el proyecto** (`STATUS.md` #28) | El flujo obligatorio lo exige, pero ninguna tarea pasó realmente por él; su propio fichero de trazabilidad conservaba una cabecera `# Test Agent` por copiar-pegar, señal de que nunca se había usado de verdad | Revisión retroactiva real sobre la superficie de autenticación → 4 hallazgos de deuda técnica documentados |
| 2 | **Fuga de información (IDOR) en Security Agent** (`STATUS.md` #28) | `routes.ts` reenviaba el mensaje interno de los casos de uso, permitiendo distinguir "sesión inexistente" de "sesión de otro usuario" en 3 rutas protegidas | `errorMapping.ts` (función pura testeada): mensaje genérico + 403; además política mínima de contraseña (8 caracteres, OWASP ASVS L1) y algoritmo JWT fijado explícitamente |
| 3 | **La jerarquía estratégica (Director→Orchestrator→Knowledge Manager) era papel mojado** (`STATUS.md` #29) | Sus ficheros de trazabilidad eran solo la cabecera; todas las tareas fueron directas usuario→agente operativo, sin punto de control que hubiera detectado el incidente #28 antes de ocurrir | Contrato de Handoff obligatorio de 8 campos (§4.1), adoptado como adenda de ADR-002 |
| 4 | **Recaída del mismo patrón en `mobile-app`** (`STATUS.md` #41) | La tarea de `LoginScreen` tocó validación de credenciales sin pasar por Security — el mismo hueco "cerrado" en #28 volvió a producirse | Revisión retroactiva contra checklist OWASP; hallazgo nuevo: URL de API por defecto en `http://` corregida en `.env.example` |
| 5 | **Skills desactualizadas / ADR asumiendo un flujo de PR inexistente** (`STATUS.md` #17) | `reviewer.md` presuponía un flujo de Pull Request antes de que existiera control de versiones inicializado | Resuelto de facto al inicializar git; 5 hallazgos documentados y cerrados |

### 7.2 Bugs funcionales reales

| # | Bug | Causa | Solución |
|---|---|---|---|
| 6 | Rating inicial ignoraba el nivel académico (`STATUS.md` #27) | `INITIAL_RATING` era una constante plana (1200) en vez de la semilla por nivel de `ADR-005` (Primaria 800 / Secundaria 1200 / Bachillerato 1600 / Ingeniería 2000); el bug quedó enmascarado porque todos los tests usaban Secundaria | Corregido en los 4 casos de uso consumidores |
| 7 | `turbo run test` fallaba en paquetes sin tests aún (#16) | `vitest run` sale con código 1 si no encuentra tests | `--passWithNoTests` en 8 `package.json` |
| 8 | Versión de `langchain` incompatible con `@langchain/core` 1.x | Fijado a `^1.5.0` |
| 9 | `FakeEmbedder` con dimensión incorrecta (8 vs 384) rompía pgvector; test de similitud mal diseñado (#33) | `FakeEmbedder` corregido a 384 dimensiones; test rediseñado para verificar solo la mecánica de orden por distancia SQL |
| 10 | Suite de tests de `IAClient` no parseaba por un `it()` anidado mal editado manualmente (#57) | Separado en dos tests hermanos |
| 11 | **El LLM devolvía `number` donde el contrato exigía `string`; Zod rechazaba lotes completos** (#57) | `correctAnswer`/`options` llegaban como JSON number en Modo Resolución | `stringifiableValue` (`z.union([string,number]).transform(String)`) — coacciona en el borde. Resultado: de 16/48 fallidos a 48/48 tras el fix |
| 12 | Rate limiting no gestionado: 96% de fallo en un lote de generación (216 llamadas sin pausa, #54) | Backoff exponencial con reintentos acotados |
| 13 | **Bug sistémico "Siguiente ejercicio repetía siempre el mismo"** (#62, el fix más extenso del proyecto) — **dos causas raíz independientes**: (a) `GenerateExerciseBatchUseCase` asignaba la misma dificultad a todo un lote, y con varios ejercicios empatados `SelectNextExerciseUseCase` siempre devolvía el primero por `reduce`; (b) `SelectNextExerciseUseCase` nunca filtraba por `type` (Test/Resolution), violando una invariante ya documentada en `Session.ts` pero nunca aplicada | (a) `computeSpreadDifficulty` reparte la dificultad de forma determinista; (b) filtro por tipo aplicado también en `StartSessionUseCase`; efecto lateral en frontend corregido de paso (dependencia de `useEffect` en `exercise?.id`) |
| 14 | Sesión de cliente no se invalidaba ante un 401 de token caducado (#59) | `expireSession()` en el store, invocado por `fetchClient.ts` ante cualquier 401 de ruta protegida |

### 7.3 Incidentes operativos y de infraestructura

- **DevOps** (`.ai/prompts/devops.md`, 10 problemas documentados en una sola sesión, 2026-08-10): CWD incorrecto en el entrypoint Docker, `@prisma/client` sin generar, lockfile de Windows sin binarios Linux, proceso `tsx watch` que no se reiniciaba tras crash, error `EXDEV` al mover archivos entre bind mounts distintos, test de integración sin aislamiento entre ejecuciones, `.gitignore` que ocultaba código fuente real (`rag/`), build de Docker sin `.dockerignore`, script `dev-env.ps1` con bugs propios, caída de Docker Desktop durante `docker rmi`.
- **Configuración/entorno**: 402 de saldo de un proveedor de IA inicialmente confundido con un bug de código (#51); URL de API mal configurada (#52); `JWT_SECRET` ausente tras reinicio (#59); variables de entorno de RAG nunca configuradas, dejando la tabla de conocimiento vacía (#58).
- **Específicos de Windows**: instalar `cors` rompió el binario opcional nativo de Rollup en todo el monorepo (bug conocido de npm, #47); separadores de ruta `\` vs `/` rompían tests de sistema de archivos (#47); `expo start --web` fallaba de forma determinista por symlinks de Metro en Windows (#46, mitigado con `expo export` + `serve`, no resuelto de raíz).

### 7.4 Decisiones revertidas o corregidas tras revisión

- **`ADR-015` corregido en la misma tarea de creación**: decisión inicial de usar `expo-secure-store` invalidada al confirmarse que el despliegue incluye Web (esa librería no existe en navegador).
- **Selector de nivel académico rediseñado**: de "4 chips independientes" a "4 estrellas acumulativas" al señalar el usuario que el dato es ordinal, no una elección discreta.
- **Paquete completo de 5 ADRs de seguridad descartado** por sobredimensionar la postura de seguridad (Vault, RBAC formal, Zero Trust) para el estado real del proyecto — sustituido por un único `ADR-012` proporcionado al riesgo real.
- **Chroma descartado por pgvector** para RAG, tras confirmar que el cliente JS de LangChain para Chroma exige un servidor HTTP aparte sin modo embebido en Node — pgvector elegido por consistencia transaccional y cero servicios nuevos.
- **`@langchain/community` descartado** por arrastrar una dependencia conflictiva (`@browserbasehq/stagehand`) para una integración que no se iba a usar.

---

## 8. Patrones de aprendizaje transversales

1. **El propio sistema falló en seguir su propio flujo de gobernanza — y lo hizo dos veces.** El hueco de Reviewer/Security se "cerró" tras el incidente #28 y **volvió a reaparecer** en una tarea posterior (#41). La lección explícita del proyecto: la solución no fue "tener más cuidado" sino instalar un mecanismo mecánico de bloqueo (el Contrato de Handoff) — **cambio de proceso, no de intención**.
2. **Los huecos de diseño se revelan al construir el siguiente consumidor real**, no en la fase de diseño. Patrón repetido en al menos 5 incidentes distintos (#27, #31, #33, #34, #46): cada pieza nueva de infraestructura o pantalla expone algo que una capa "ya cerrada" no cubría.
3. **Los adaptadores que hablan con red/hardware real se aceptan sin test automático como deuda documentada explícita**, en contraste deliberado con los casos donde sí se exige infraestructura real en los tests (Postgres real, pgvector end-to-end) — porque un mock "no puede demostrar persistencia real".
4. **Confiar en la forma de salida de un LLM sin validar en el borde produce fallos reproducibles y costosos** (incidente Zod `number`/`string`, #57): la regla aprendida se generaliza como principio de diseño, no como parche puntual.
5. **Los errores de entorno Windows son una fuente recurrente y ajena a la lógica de negocio**: aparecen en al menos 4 incidentes distintos y se resuelven siempre aislando el problema sin bloquear el resto del pipeline.
6. **Diagnóstico por capas antes de corregir código**: varios incidentes con síntoma inicial engañoso (402 de facturación, URL mal configurada, bug sistémico de selección de ejercicio) se resolvieron verificando primero con herramientas externas, evitando fixes en la causa equivocada.
7. **Las decisiones de "renombrar/limpiar más adelante" tienden a demorarse sin un disparador concreto**: el renombrado completo `QwenClient`→`IAClient` estaba señalado como provisional desde el ADR fundacional, pero no se ejecutó hasta la entrada #60 del proyecto.

---

## 9. Línea de tiempo del proyecto

| Fecha | Hitos principales |
|---|---|
| 2026-08-06 | Fundación: ADR-000 a ADR-006, User Stories y Casos de Uso base, scaffolding del monorepo, primer ciclo TDD (`AdaptiveDifficultyEngine`) |
| 2026-08-07 | Backend real (auth, controllers, Express); **incidente de gobernanza #28/#29** y adopción del Contrato de Handoff; US-008 (RAG) definida |
| 2026-08-08 | `ADR-014` (RAG), ingesta end-to-end con pgvector y embeddings reales; renombrado inicial por neutralidad de proveedor |
| 2026-08-09 | Arranque de `mobile-app`: `ADR-015`, autenticación, `LoginScreen`/`RegisterScreen` |
| 2026-08-10 | `HomeScreen`, incidente de CORS, `ADR-016` (Docker), 10 incidentes de DevOps resueltos |
| 2026-08-11 | `ADR-017` (trazabilidad estructurada + KPIs), pantalla de Sesión, generación de ejercicios por lotes, pantalla de Resumen |
| 2026-08-12 | Bug sistémico "siguiente ejercicio" corregido (dos causas raíz), pantalla de Estadísticas, primer merge a `main` |

---

## 10. Conclusiones

- Un sistema multiagente de IA gobernado por reglas explícitas (`.ai/AGENTS.md`, ADRs) **no garantiza por sí solo el cumplimiento de esas reglas**: los datos medidos (§5) muestran 0% de adherencia al flujo completo incluso después de introducir un mecanismo de control (el Handoff).
- La gobernanza solo se vuelve verificable cuando pasa de estar **descrita** en prosa a estar **instrumentada** con datos estructurados y KPIs automáticos (evolución ADR-003 → ADR-017) — este es el aporte metodológico más defendible del TFM.
- Los errores documentados no son un fracaso del proceso, sino su **material de evidencia principal**: cada incidente de gobernanza motivó un mecanismo de corrección concreto y trazable (adenda de ADR, nuevo KPI, nueva regla), en vez de quedar como anécdota no accionable.
- Trabajo futuro identificado por el propio proyecto: instrumentar `cobertura_real%` de código (no solo declarada), cerrar la brecha de Reviewer/Documentation (50% de cumplimiento cuando el flujo lo exige) y definir bucles explícitos de retrabajo cuando un agente posterior rechaza el trabajo de uno anterior (limitación reconocida en `ADR-002`, "Consecuencias").

---

## Anexo A — Glosario de agentes

| Agente | Una línea |
|---|---|
| Project Director | Interfaz con el usuario; refina y conserva la intención original |
| Project Orchestrator | Descompone y coordina tareas; valida el handoff |
| Knowledge Manager | Contexto y coherencia documental antes de cualquier trabajo |
| Product | Convierte necesidades en User Stories y criterios de aceptación verificables |
| Architecture | Diseño técnico, ADRs, diagramas, casos de uso |
| Test | Escribe pruebas antes del código; nunca implementa producto |
| Developer | Implementa solo sobre tests ya existentes |
| Reviewer | Última barrera de calidad antes de seguridad |
| Security | OWASP, secretos, hardening, dependencias |
| Documentation | Mantiene viva toda la documentación del proyecto |
| DevOps | Docker, CI/CD, entornos |

## Anexo B — Fuentes documentales citadas

- `.ai/AGENTS.md` — reglas, jerarquía, RACI
- `docs/ADR-000_Estructura.md`, `ADR-001_LenguajesMetodologias.md`, `ADR-002_Agentes.md`, `ADR-003_Trazabilidad.md`
- `docs/ADR/ADR-017_trazabilidad_y_metricas.md`, `docs/metrics/trazabilidad.md`
- `docs/STATUS.md` (entradas #1 a #62)
- `.ai/prompts/devops.md`, `.ai/prompts/reviewer.md`
- `scripts/metrics/trazabilidad.ts`, `README.md`
- Historial de commits del repositorio (2026-08-06 a 2026-08-12)

## Anexo C — Propuesta de estructura de slides

Mapeo directo de este documento a un guion de presentación (≈20-24 slides):

| Bloque | Slides sugeridas | Contenido fuente |
|---|---|---|
| Apertura | 1-2 | Título, objetivo del TFM (§1) |
| El producto en una frase | 1 | §1, README.md |
| Diseño de la gobernanza | 3-4 | §2 (jerarquía + tabla de agentes + RACI resumida) |
| Reglas transversales | 1-2 | §3 |
| El incidente que cambió el proceso | 2 | §4.1 (Handoff) — usar la cita literal de la motivación como slide de impacto |
| De la prosa al dato medible | 2 | §4.2 (ADR-003 → ADR-017) |
| **Resultados medidos** | 2-3 | §5 (tabla de KPIs — slide central de la defensa) |
| Buenas prácticas (top 5) | 1-2 | §6 (seleccionar las 5 más defendibles) |
| Errores cometidos (casos seleccionados) | 3-4 | §7 (elegir 4-5 incidentes más ilustrativos, uno por categoría) |
| Patrones de aprendizaje | 1-2 | §8 |
| Línea de tiempo | 1 | §9 (versión visual/gráfica) |
| Conclusiones y trabajo futuro | 1-2 | §10 |
| Cierre / preguntas | 1 | — |

**Recomendación de énfasis para la defensa**: la slide con más impacto argumental es la de §5 (0% de adherencia al flujo completo) combinada con la cita literal de §4.1 — muestra que el TFM no solo construyó un sistema multiagente, sino que lo sometió a medición honesta y lo corrigió con evidencia, que es precisamente el criterio que distingue una gobernanza real de una meramente declarativa.
