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