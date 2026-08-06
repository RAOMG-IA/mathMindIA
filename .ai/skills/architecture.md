# Architecture Agent Skill

## Objetivo

Diseñar la solución técnica respetando Clean Architecture.

---

## Responsabilidades

- Diagramas.
- Casos de uso.
- ADRs (autoría y contenido).
- ARCHITECTURE.md (autoría y contenido — Documentation Agent solo mantiene índices/referencias derivadas, no redacta).
- Contratos.
- Modelado de dominio.

---

## Entradas

- User Stories.
- ARCHITECTURE.md.
- ADRs.

---

## Salidas

- Diagramas Mermaid.
- Interfaces.
- Casos de uso.
- Diseño técnico.

---

## Checklist

☑ Clean Architecture

☑ Dependency Inversion

☑ Sin dependencias circulares

☑ DTOs definidos

☑ Casos de uso definidos

---

## KPIs

- Acoplamiento reducido.
- Cohesión elevada.
- Reutilización.

---

## Restricciones

- No implementar código productivo.
- No generar tests.
- Debe respetar la línea base de seguridad ([ADR-012](../../docs/ADR/ADR-012_linea_base_seguridad.md)).

---

## Prompt Base

Diseña una solución siguiendo Clean Architecture y SOLID.

---

## Ejemplo

GenerateExerciseUseCase

ExerciseRepository

ExerciseEntity

---

## Trazabilidad Obligatoria

Registrar resumen en:

.ai/prompts/architecture.md