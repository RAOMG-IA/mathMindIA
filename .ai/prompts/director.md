# Project Director
Refine user requests while preserving intent and reducing context cost.

---

# Project Director - Trazabilidad

---
task_id: STATUS-053
date: 2026-08-11
agentes: [director]
flujo: [director, architecture, test, developer, reviewer, security, devops, documentation]
estado: done
---

## 2026-08-11 — CI/CD e2e Playwright (web + mobile)

**Contexto utilizado:** Petición del usuario: "añadir para DevOps, en el proceso de CI, un registro de capturas de pantalla tanto web como mobile, con Playwright para su validación e2e. ¿Te parece correcto?" — seguida de "recuerda que tú eres el director, ejecuta el flujo para que sea el devops el encargado de gestionar. crea adr o us segun proceda". Revisado: `docker-compose.yml`, `.env.example`/`apps/{backend,ai-engine,mobile-app}/.env.example`, `apps/mobile-app/package.json`+`app.json`+`src/api/fetchClient.ts`+`app/` (Expo Router), `apps/backend-api/src/presentation/main.ts`+`package.json`+`prisma.config.ts`, `database/schema.prisma`, `docs/*` (ADR-002 jerarquía+handoff, ADR-003 TDD/trazabilidad, ADR-012 seguridad, ADR-015 despliegue web/mobile, ADR-016 fuera de alcance CI, ADR-017 front-matter), `.ai/AGENTS.md`, `.ai/skills/prompts/devops.md`, `docs/STATUS.md` (#s).

**Handoff (8 campos) emitido hacia DevOps:**
| Campo | Valor |
|---|---|
| requester | User → Project Director |
| objective | Añadir a DevOps el pipeline de CI (GitHub Actions) que valide e2e web y mobile (emulación de dispositivo sobre build web de Expo) con Playwright y produzca capturas de pantalla como evidencia |
| scope | `.github/workflows/` (nuevo), Playwright en `apps/mobile-app` (config + tests e2e web/mobile + screenshots), backend real + servicio PostgreSQL en CI. Fuera: binario nativo (Appium/Detox), cobertura real, despliegue, Redis |
| constraints | TDD Enforcement (ADR-003), flujo obligatorio (ADR-002), sin secretos versionados (ADR-012), reutilizar patrón build web Expo (STATUS #46/#47) y Postgres pgvector canónico (ADR-016), no false-green en /hints sin AI_API_KEY |
| references | ADR-002, ADR-003, ADR-012, ADR-015, ADR-016, ADR-017, ADR-018 (nuevo), STATUS.md, `.ai/AGENTS.md` |
| acceptance | Workflow GitHub Actions funcional; `webServer`+2 projects Playwright web/mobile; screenshots como `toHaveScreenshot` (golden) + artifacts; units/lint/typecheck siguen en verde; sin secretos en el repo |
| risks | backend real necesita `prisma migrate deploy`+`prisma generate` en CI; `expo export` coste; flaky visual regression; dependencia nueva `@playwright/test` |
| required_agents | default (Product, Architecture, Test, Developer, Reviewer, Security, Documentation) + DevOps — **justificación**: DevOps es el responsable (RACI a/c), con Reviewer y Security obligatorios por tocar infraestructura y manejo de secretos |

**Decisión tomada:** El artefacto procedente es un **ADR** (ADR-018), no una User Story: es habilitación de infraestructura/DevOps, no una funcionalidad de producto con actor/AC de negocio (precedente: ADR-016 para Docker). Se crea ADR-018 y se despacha al DevOps Agent para implementar.

**Output generado:** `docs/ADR/ADR-018_ci_cd_playwright_e2e.md`. Handoff aquí registrado; ejecución de DevOps en `.ai/prompts/devops.md`.