# DevOps Agent

Docker, CI/CD, GitHub Actions and deployment pipelines.

---

# DevOps Agent - Trazabilidad

## 2026-08-10: Verificación del entorno contenedorizado (ADR-016)

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
