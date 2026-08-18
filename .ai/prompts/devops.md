# DevOps Agent

Docker, CI/CD, GitHub Actions and deployment pipelines.

---

# DevOps Agent - Trazabilidad

---
task_id: STATUS-051
date: 2026-08-10
agentes: [devops]
flujo: [orchestrator, architecture, test, developer, reviewer, security, devops, documentation]
estado: done
---

## 2026-08-10 — Verificación del entorno contenedorizado (ADR-016)

**Contexto:** Entorno Docker Compose (postgres pgvector en 5433, redis 6379, node) con volumen `node_modules` Linux. Backend en `tsx watch` dentro de `mathmindia-node`. Host Windows con Postgres local en 5432 (no se toca).

**Realizado:**
- Migración formal creada y aplicada en el Postgres del contenedor: `database/migrations/20260810083120_init` (desbloquea STATUS #31/#33).
- Backend en contenedor responde `/health` => `{"status":"ok"}`.
- Tests de integración en contenedor: **31/31 PASS** (repositorios Prisma + RAG).
- Tests unitarios en contenedor: **86/86 PASS**. Typecheck OK.
- Smoke E2E contra el contenedor: register → login → session → answer (42, correcta) → statistics → temas → hints (403 esperado sin AI_API_KEY) → sessions/end. OK.
- RAG end-to-end en contenedor: ingest (1 procesado, 0 errores) → `rag_chunks` con embeddings 384-dim → búsqueda pgvector (`<=>`) devuelve el chunk relevante. OK.

**Problemas encontrados y resueltos:**
1. Entrypoint corría desde `/workspace` en vez de `apps/backend-api` (CWD bug) → CWD fix + `prisma generate` explícito en el entrypoint.
2. `@prisma/client` stub sin generar (postinstall no resuelve con `prisma.config.ts` no estándar) → `db:generate` en entrypoint + script setup.
3. Lockfile generado en Windows con solo binarios win32 → `npm install`/`npm ci` Linux no instala esbuild/rollup natives linux → `optionalDependencies` explícitas en root `package.json` + lockfile regenerado en contenedor (entradas linux en el mapa).
4. `tsx watch` no se reinicia tras crash del proceso hijo → `dev-env.ps1` hace `docker compose restart node` tras la migración.
5. EXDEV en `NodeIngestionFileSystem.moveToHistory` (bind mounts separados `rag/input` y `rag/history`) → fallback `copyFile`+`unlink` + test unitario.
6. Test de integración `PostgresKnowledgeBaseIndex` asumía tabla vacía → aislamiento (borrado scoped de `rag_chunks`).
7. `.gitignore` `rag/` ignoraba el código en `src/infrastructure/rag/` → anclado a `/rag/`.
8. Build context sin `.dockerignore` (node_modules del host al daemon) → creado; Docker BuildKit en bucle con registry flaky → builder legacy (`DOCKER_BUILDKIT=0`) fiable.
9. `dev-env.ps1` con bugs (Test-Port indefinido, cd hardcodeado, puerto desplazado en re-ejecución) → reescrito e idempotente, validado end-to-end.
10. Docker Desktop se cayó durante `docker rmi` → rearrancado automáticamente (espera hasta 180s) y verificado.

**Conflictos documentados:**
- Registry de Docker Hub intermitente (502) → reintentos + builder legacy.
- Postgres local en 5432 → contenedor en 5433 (script auto-selecciona puerto en el primer run).
- `prisma migrate dev` funciona con el usuario `mathmind` (superuser) definido en compose.
- `hints` devuelve 403 sin `AI_API_KEY`/`AI_BASE_URL` (esperado, documentado en main.ts).

**Pendiente:** registro de `rag_ingestion_records` con `chunk_count=1` para la demo; re-ingest planificado si se destruye la DB (el fichero queda en `rag/history/`).

---
task_id: STATUS-053
date: 2026-08-11
agentes: [devops, director]
flujo: [director, architecture, devops]
artefactos: [.github/workflows/e2e.yml, apps/mobile-app/playwright.config.ts, apps/mobile-app/e2e/serve.mjs, apps/mobile-app/e2e/app.spec.ts, apps/mobile-app/package.json, .gitignore, docs/ADR/ADR-018_ci_cd_playwright_e2e.md]
tests: [npx playwright test (web+mobile), vitest run --exclude 'e2e/**']
estado: done
---

## 2026-08-11 — CI/CD E2E Playwright (web + mobile), implementacion de ADR-018

**Contexto:** El subagente DevOps despachado desde director devolvió resultado vacío y no creó nada; la implementación la completó el rol DevOps inyectado desde el Director (mismo responsable RACI, evitando entregar vacío). Stack: monorepo npm workspaces + Turborepo; `mobile-app` es Expo + react-native-web (una base → web y móvil, ADR-015); `backend-api` Express+Prisma 7 sobre Postgres pgvector (ADR-016/ADR-014), `prisma.config.ts` no estándar.

**Decisión / Realizado:**
- `.github/workflows/e2e.yml`: jobs `quality` (turbocli typecheck+lint+test) y `e2e` (servicio postgres `pgvector:pg16` + `prisma generate` + `prisma migrate deploy` + `expo export --platform web` + `playwright install --with-deps chromium` + `npx playwright test` + upload artifacts de report y screenshots). `JWT_SECRET` como `${{ secrets.JWT_SECRET || 'mathmind-ci-dev-only-secret' }}` (sin valor real versionado, ADR-012; fallback no productivo mismo criterio del compose de ADR-016). 2 capturas: playwright-report/ y test-results/screenshots/.
- `apps/mobile-app/playwright.config.ts`: projects `web` (Desktop Chrome) y `mobile` (Pixel 7, emulación del build web — no binario nativo, ADR-018). `webServer` doble: build web estático (8081) + backend real (3000, health).
- `apps/mobile-app/e2e/serve.mjs`: servidor estático mínimo (node http) sin dependencia nueva para servir `./dist`.
- `apps/mobile-app/e2e/app.spec.ts`: UI (login→home, register) con capturas por project; contrato API (register→login→temas→sessions→answers→statistics→end + 401 sin token) con `request` fixture, solo en `web`. Selectores por `getByLabel` (accessibilityLabel real) / `getByRole`.
- `apps/mobile-app/package.json`: `@playwright/test` (devDep), scripts `test:e2e`/`e2e:serve`; `test` ahora excluye `e2e/**` (sin esto vitest recogería app.spec.ts).
- `.gitignore`: playwright-report/, test-results/, blob-report/. ADR-018 creado por el Director.

**Verificado:** 8 tests enumerados (web+mobile) con `playwright test --list` (config+specs cargan). `vitest run --exclude 'e2e/**'` → 46/46 en `mobile-app` (e2e correctamente fuera del runner unitario). `tsc --noEmit` de `mobile-app` en verde. Bug ESM resuelto de paso: `import.meta` + paquete no-ESM → `process.cwd()` en el spec.

**Limitación del entorno (no verificable aquí):** el `ai-engine` typecheck falla por `node_modules` parcial (faltan `@langchain/openai`, `@langchain/textsplitters`, `eslint` — declarados pero no instalados en este árbol de trabajo); no está causado por este cambio (no toca ai-engine). La ejecución real de los e2e (browsers + backend + Postgres) y el workflow completo requieren el runner de GitHub Actions; localmente se valida carga/typecheck/tests unitarios.

**Pendiente (fuera de alcance ADR-018):** binario nativo Android/iOS (Appium/Detox), cobertura real `@vitest/coverage-v8`, visual regression goldens (`toHaveScreenshot`) — dependen de baseline y de e2e real en CI.
