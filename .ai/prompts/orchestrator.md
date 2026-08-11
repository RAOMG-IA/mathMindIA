# Project Orchestrator
Decompose tasks and coordinate agent execution workflow.

---

---
task_id: STATUS-029
date: 2026-08-07
handoff_ref: STATUS-029
agentes: [orchestrator]
flujo: [orchestrator, architecture, documentation]
artefactos: [docs/ADR-002_Agentes.md, .ai/AGENTS.md, docs/STATUS.md]
estado: done
---

## 2026-08-07 — Primer handoff real: Contrato de Handoff obligatorio (dogfooding)

**Input**: tras detectar que Director/Orchestrator/Knowledge Manager nunca habían gestionado ninguna tarea real (ver `STATUS.md` #28/#29), el usuario propuso un contrato de handoff estructurado para forzarlo mecánicamente. Este es el primer handoff registrado de verdad — el de definir el propio contrato.

```yaml
handoff:
  requester: "User"
  objective: >
    Formalizar un contrato de handoff obligatorio entre agentes (Director/Orchestrator/
    Knowledge Manager -> Agentes Operativos) para que la jerarquia de decision de ADR-002
    se siga en la practica, no solo sobre el papel.
  scope: >
    Adenda a ADR-002, seccion nueva en AGENTS.md, actualizacion de las skills
    director/orchestrator/knowledge-manager, primera entrada real en este fichero,
    entrada de STATUS.md. No incluye tooling que automatice la validacion (fuera de
    alcance, ver plan).
  constraints:
    - "No crear un tipo de fichero nuevo para los handoffs -- reutilizar .ai/prompts/*.md"
    - "No anadir mas de 1 campo a la plantilla propuesta por el usuario (proporcionalidad)"
    - "No aplicar el contrato retroactivamente al historico de STATUS.md"
  references:
    - "ADR-002_Agentes.md (jerarquia de decision y flujo obligatorio ya definidos)"
    - "ADR-003_Trazabilidad.md (formato Input/Contexto/Decision/Output ya existente)"
    - "STATUS.md #28 (hueco de Reviewer/Security ya detectado y corregido)"
  acceptance:
    - "ADR-002 tiene una adenda con la plantilla, la regla de validacion y un ejemplo"
    - "AGENTS.md referencia el contrato junto al Flujo Obligatorio de Desarrollo"
    - "director.md/orchestrator.md/knowledge-manager.md reflejan su rol en el handoff"
    - "Este fichero deja de estar vacio, con un primer handoff real registrado"
  risks:
    - "Que el contrato se quede en papel igual que el flujo original si no se usa en la siguiente tarea real"
  required_agents:
    - "Architecture Agent (autoria de la adenda ADR-002)"
    - "Documentation Agent (AGENTS.md, STATUS.md)"
```

**Validación**: handoff completo (8/8 campos) — se procede a ejecutar.

**Output generado**: `docs/ADR-002_Agentes.md` (adenda), `.ai/AGENTS.md` (sección "Handoff Obligatorio"), `.ai/skills/{director,orchestrator,knowledge-manager}.md` (responsabilidades actualizadas), esta entrada, `docs/STATUS.md` (#29).

---

---
task_id: STATUS-030
date: 2026-08-07
handoff_ref: STATUS-030
agentes: [orchestrator]
flujo: [orchestrator, knowledge, product]
artefactos: [docs/user-stories/US-008-subir-material-rag.md, docs/user-stories/README.md]
estado: done
---

## 2026-08-07 — Segundo handoff real: US-008 Consolidar Base de Conocimiento (RAG)

**Input**: el usuario pidió una User Story para `ai-engine` que permita subir ficheros (bancos de problemas, notas, pistas) para consolidar RAG.

```yaml
handoff:
  requester: "User"
  objective: >
    Historia de usuario para subir material de referencia (bancos de problemas, notas,
    pistas) que consolide una base de conocimiento (RAG) sobre la que UC-001/UC-003
    generen contenido, en vez de partir solo del conocimiento general del modelo.
  scope: >
    Un archivo docs/user-stories/US-008-*.md (formato Como/Quiero/Para + Gherkin,
    ADR-002/product.md), indice de docs/user-stories/README.md actualizado. No incluye
    diseno tecnico (tecnologia de indexado, formatos soportados) ni Caso de Uso nuevo.
  constraints:
    - "No crear arquitectura ni decidir tecnologia de RAG (restriccion de product.md)"
    - "No asumir un actor/rol que no existe en el dominio (User no tiene rol, ADR-004) sin flaggearlo"
  references:
    - "ARCHITECTURE.md, seccion Estrategia IA (uso permitido: generar ejercicios/pistas/contenido)"
    - "UC-001-generate-exercise-batch.md, UC-003-generate-hint.md (unicos puntos que construyen prompts hacia Qwen)"
    - "ADR-012_linea_base_seguridad.md (riesgo de prompt injection ya senalado para UC-001/UC-003)"
    - "US-007-ver-estadisticas.md (precedente de historia sin Caso de Uso asignado)"
  acceptance:
    - "Historia con Como/Quiero/Para + escenarios Gherkin, sin diseno tecnico"
    - "Hueco de actor (gestor de contenido, sin modelar en el dominio) documentado explicitamente"
    - "Riesgo de seguridad (tercera via de contenido no confiable hacia el prompt) senalado para Security Agent"
  risks:
    - "Que se trate como una historia mas de estudiante y se pierda el hueco de rol/permisos"
  required_agents:
    - "Product Agent (autoria de la historia)"
    - "Knowledge Manager (verificar que no exista ya un actor o Caso de Uso equivalente)"
```

**Validación**: handoff completo (8/8 campos) — se procede a ejecutar. Knowledge Manager: confirmado que no existe RAG de producto (solo el RAG documental interno de `knowledge-manager.md`, sobre el propio repositorio) ni actor distinto de `User` en el dominio.

**Output generado**: `docs/user-stories/US-008-subir-material-rag.md`, `docs/user-stories/README.md` (índice + nota de trazabilidad), `.ai/prompts/product.md`.

---

---
task_id: STATUS-051
date: 2026-08-10
handoff_ref: STATUS-051
agentes: [orchestrator]
flujo: [orchestrator, architecture, test, developer, reviewer, security, devops, documentation]
estado: done
---

## 2026-08-10 — Tercer handoff real: entorno de desarrollo Docker (infraestructura + Node)

**Input**: el usuario pidió comenzar la instalación en Docker para DevOps (CI/CD se demoraba por la instalación local de servicios). Como Director, se refinó el alcance vía AskUserQuestion: **solo infraestructura + contenedor de desarrollo Node** (sin imágenes de producción, sin CI, sin containerizar `mobile-app`), Redis **incluido** en el compose pese a no tener consumidor en código todavía (declarado en ARCHITECTURE/README), y el Postgres contenedor como **base canónica de desarrollo** (desbloquea `prisma migrate dev`, bloqueado por el bug de collation del Postgres local desde STATUS #31/#33).

```yaml
handoff:
  requester: "User"
  objective: >
    Entorno de desarrollo local completo via Docker: docker-compose con Postgres+pgvector,
    Redis y un contenedor de desarrollo Node.js para backend-api/ai-engine, que sustituya la
    instalacion local de servicios y desbloquee la migracion formal de Prisma.
  scope: >
    docker-compose.yml (raiz, ya existe vacio), docker/postgres (init pgvector),
    docker/node/Dockerfile, scripts/setup/* (bootstrap .env + up + migracion/seed),
    .env.example actualizado, ADR-016 + ARCHITECTURE.md. NO incluye: imagenes de produccion,
    CI/CD, containerizacion de mobile-app, ni codigo consumidor de Redis.
  constraints:
    - "Secretos solo via variables de entorno / .env, nunca versionado (ADR-012)"
    - "Node 22 segun .nvmrc; npm 11.6.1"
    - "pgvector obligatorio en la imagen de postgres (ADR-014 / RAG)"
    - "No tocar dominio, casos de uso ni persistencia (schema.prisma) en esta fase"
    - "Evitar conflicto de puerto con el Postgres local del usuario"
    - "Cero servicios nuevos mas alla de los 3 pedidos (mono-servidor)"
  references:
    - "docs/ADR/ADR-014_rag.md (pgvector)"
    - "docs/ADR/ADR-013_modelo_datos_fisico.md + database/schema.prisma (migracion pendiente)"
    - "docs/ADR/ADR-012_linea_base_seguridad.md (secretos)"
    - "docs/STATUS.md #31/#33 (bloqueo de migracion por collation local)"
    - "ARCHITECTURE.md (stack: Docker, Redis, Postgres declarados)"
    - ".nvmrc, package.json (scripts dev/build/test/integration)"
  acceptance:
    - "docker compose up -d levanta los 3 servicios con healthcheck OK"
    - "prisma migrate dev genera la migracion inicial contra el Postgres contenedor (bloqueo local resuelto)"
    - "npm run test:integration (31 tests) verde contra el Postgres contenedor"
    - "RAG end-to-end: ingest + search semanticos OK contra el contenedor"
    - "scripts/setup reproducible en una maquina limpia, documentado"
    - "Sin secretos versionados; .env documentado en .env.example"
    - "README/ARCHITECTURE/STATUS actualizados"
  risks:
    - "Puerto 5432 ocupado por el Postgres local (hay que pararlo o mapear otro puerto)"
    - "Imagen pgvector multi-arch: descarga/plataforma en Windows"
    - "Primera prisma migrate dev sobre base vacia puede detectar drift de schema"
    - "Descarga de imagenes requiere red; primera vez mas lenta"
    - "Docker daemon apagado: docker info falla (hay que arrancar Docker Desktop)"
  required_agents:
    - "Architecture Agent (ADR-016 + diseno)"
    - "Test Agent (criterios de verificacion/integracion)"
    - "Developer Agent (implementacion)"
    - "Reviewer Agent"
    - "Security Agent (secretos/ADR-012)"
    - "DevOps Agent (arranque y verificacion reales)"
    - "Documentation Agent"
    # Product NO aplica: infraestructura de desarrollo, sin requisito funcional de producto (justificacion explicita)
```

**Validación**: handoff completo (8/8 campos) — se procede a ejecutar. Entorno verificado por el Director antes del despacho: **conflictos detectados** — (1) Puerto 5432 ocupado por Postgres local (PID 11168); (2) Docker daemon apagado (engine no responde); 6379/3000 libres. Ambos se gestionan en la fase DevOps (el usuario ya decidió migrar a contenedor; habrá que parar el Postgres local).

**Output generado**: este handoff. Ficheros y tarea del commit agrupados: la tarea es `handoff-2026-08-10-docker-dev` y agrupará `docker-compose.yml`, `docker/`, `scripts/setup/`, `.env.example*`, ADR-016, `ARCHITECTURE.md`, `docs/STATUS.md`, `.ai/prompts/*` — ver `.ai/prompts/devops.md` al cierre.