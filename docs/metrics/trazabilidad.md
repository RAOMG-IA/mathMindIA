# Métricas de Trazabilidad (ADR-017)

Reporte generado por `npm run metrics -- --report` — ver [ADR-017](../ADR/ADR-017_trazabilidad_y_metricas.md).

Fecha de ejecución: 2026-08-11

Entradas analizadas: **19** con front-matter / **67** sin (total 86)

Tareas (task_id) distintas: **12**


## KPIs globales

| KPI | Valor |
|---|---|
| % tareas con handoff (`handoff_ref`) | 33.3% (4/12) |
| % con Reviewer | 16.7% (2/12) |
| % con Security | 66.7% (8/12) |
| Adherencia al flujo completo (7 fases) | 0.0% (0/12); solape medio 33.3% |
| Tasa de retrabajo | 0.0% (0/12) |
| Cobertura de tests declarados | 0.0% (0/12) |
| Cobertura declarada (verdes = total) | n/a (0/0); agregado Σ n/a |
| Huecos de trazabilidad (STATUS.md sin entrada) | 21 — STATUS-5, STATUS-18, STATUS-20, STATUS-21, STATUS-24, STATUS-25… (+15) |

> `cobertura_real%` (cobertura de código con `@vitest/coverage-v8`) es un **target futuro** declarado en ADR-017 §3, no instrumentado aún.


## Rework por agente que lo detecta

| Agente | Tareas en rework |
|---|---|

## Cobertura de agentes (tareas con entrada / tareas donde el flujo lo exigía)

| Agente | Num | Den | % |
|---|---|---|---|
| product | 2 | 2 | 100.0% |
| architecture | 1 | 6 | 16.7% |
| test | 0 | 1 | 0.0% |
| developer | 0 | 5 | 0.0% |
| reviewer | 1 | 2 | 50.0% |
| security | 7 | 8 | 87.5% |
| documentation | 2 | 4 | 50.0% |