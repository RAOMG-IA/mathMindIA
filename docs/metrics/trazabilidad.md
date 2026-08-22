# Métricas de Trazabilidad (ADR-017)

Reporte generado por `npm run metrics -- --report` — ver [ADR-017](../ADR/ADR-017_trazabilidad_y_metricas.md).

Fecha de ejecución: 2026-08-22

Entradas analizadas: **94** con front-matter / **18** sin (total 112)

Tareas (task_id) distintas: **52**


## KPIs globales

| KPI | Valor |
|---|---|
| % tareas con handoff (`handoff_ref`) | 9.6% (5/52) |
| % con Reviewer | 7.7% (4/52) |
| % con Security | 19.2% (10/52) |
| Adherencia al flujo completo (7 fases) | 1.9% (1/52); solape medio 28.0% |
| Tasa de retrabajo | 0.0% (0/52) |
| Cobertura de tests declarados | 0.0% (0/52) |
| Cobertura declarada (verdes = total) | n/a (0/0); agregado Σ n/a |
| Huecos de trazabilidad (STATUS.md sin entrada) | 1 — STATUS-018 |

> `cobertura_real%` (cobertura de código con `@vitest/coverage-v8`) es un **target futuro** declarado en ADR-017 §3, no instrumentado aún.


## Rework por agente que lo detecta

| Agente | Tareas en rework |
|---|---|

## Cobertura de agentes (tareas con entrada / tareas donde el flujo lo exigía)

| Agente | Num | Den | % |
|---|---|---|---|
| product | 3 | 4 | 75.0% |
| architecture | 25 | 28 | 89.3% |
| test | 16 | 19 | 84.2% |
| developer | 27 | 30 | 90.0% |
| reviewer | 3 | 4 | 75.0% |
| security | 9 | 10 | 90.0% |
| documentation | 3 | 7 | 42.9% |