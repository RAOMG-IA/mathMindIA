# Project Orchestrator
Decompose tasks and coordinate agent execution workflow.

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