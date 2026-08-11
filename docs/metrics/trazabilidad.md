# Métricas de Trazabilidad (ADR-017)

Reporte generado por `npm run metrics -- --report` — ver [ADR-017](../ADR/ADR-017_trazabilidad_y_metricas.md).

Fecha de ejecución: 2026-08-11

Entradas analizadas: **86** con front-matter / **0** sin (total 86)

Tareas (task_id) distintas: **49**


## KPIs globales

| KPI | Valor |
|---|---|
| % tareas con handoff (`handoff_ref`) | 8.2% (4/49) |
| % con Reviewer | 4.1% (2/49) |
| % con Security | 16.3% (8/49) |
| Adherencia al flujo completo (7 fases) | 0.0% (0/49); solape medio 25.4% |
| Tasa de retrabajo | 0.0% (0/49) |
| Cobertura de tests declarados | 0.0% (0/49) |
| Cobertura declarada (verdes = total) | n/a (0/0); agregado Σ n/a |
| Huecos de trazabilidad (STATUS.md sin entrada) | 1 — STATUS-018 |

> `cobertura_real%` (cobertura de código con `@vitest/coverage-v8`) es un **target futuro** declarado en ADR-017 §3, no instrumentado aún.


## Rework por agente que lo detecta

| Agente | Tareas en rework |
|---|---|

## Cobertura de agentes (tareas con entrada / tareas donde el flujo lo exigía)

| Agente | Num | Den | % |
|---|---|---|---|
| product | 2 | 2 | 100.0% |
| architecture | 24 | 26 | 92.3% |
| test | 15 | 17 | 88.2% |
| developer | 26 | 28 | 92.9% |
| reviewer | 1 | 2 | 50.0% |
| security | 7 | 8 | 87.5% |
| documentation | 2 | 4 | 50.0% |