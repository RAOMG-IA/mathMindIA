# ADR-016: Entorno de Desarrollo con Docker

## Estado

Aceptado

## Contexto

El repositorio declara Docker, Docker Compose y Redis como parte del stack ([ARCHITECTURE.md](../../ARCHITECTURE.md), [README.md](../../README.md)), pero el estado real era:

- `docker-compose.yml` vacío (0 bytes), `docker/` y `.github/workflows/` vacíos — Docker declarado pero nunca implementado.
- Los servicios (PostgreSQL, Redis) se instalaban y gestionaban en local por cada desarrollador; la migración formal `prisma migrate dev` llevaba bloqueada desde `STATUS.md` #31/#33 por un bug de collation del Postgres local de Windows.
- El RAG ([ADR-014](ADR-014_rag.md)) requiere pgvector (`Unsupported("vector(384)")` en `database/schema.prisma`).
- Redis aparece en `.env.example` y en el stack declarado, pero no tiene consumidor en código todavía (0 referencias) — se decide incluir el servicio igualmente, porque el `HintUsageTracker` (UC-003) ya previó un contador efímero que acabará en Redis y no añade coste real.

## Decisión

Un `docker-compose.yml` en la raíz del repo con **tres servicios de desarrollo**:

| Servicio | Imagen | Motivo |
|---|---|---|
| `postgres` | `pgvector/pgvector:pg16` | PostgreSQL 16 con la extensión `vector` preinstalada (ADR-014), base canónica de desarrollo |
| `redis` | `redis:7-alpine` | Servicio declarado en el stack; sin consumidor de código aún, se levanta para el entorno completo |
| `node` | `node:22` (Dockerfile propio en `docker/node/`) | Contenedor de desarrollo del monorepo: `backend-api` + `ai-engine` + `packages` con `tsx watch`, alineado con `.nvmrc` |

### Decisiones concretas

- **Base canónica**: el Postgres contenedor sustituye al Postgres local como base de desarrollo. El bug de collation de la instalación local no existe en un contenedor limpio → se desbloquea `prisma migrate dev` (pendiente desde #31/#33). Si el Postgres local sigue corriendo, ocupará el puerto 5432: se mapea `POSTGRES_PORT` a otro puerto o se detiene el servicio local (ver `scripts/setup/dev-env.ps1`, avisa del conflicto).
- **Configuración vía variables**: credenciales y puertos se parametrizan con defaults de desarrollo seguros en `.env` raíz (plantilla en `.env.example`), interpolados por compose: `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_PORT`/`REDIS_PORT`/`APP_PORT`/`JWT_SECRET`/`AI_*`/`RAG_*`.
- **`DATABASE_URL` del contenedor** apunta a `postgres:5432` (red interna de compose). `main.ts` y `prisma.config.ts` usan `dotenv`, que **no pisa variables ya definidas** → las `environment:` del compose tienen prioridad sobre el `.env` montado. El `.env` del host (`apps/backend-api/.env`) sigue siendo válido para ejecuciones en el host.
- **Contenedor `node`**: bind mount del repo en `/workspace` + volumen nombrado `node_modules` (deps Linux, aislado del `node_modules` de Windows del host). Un entrypoint instala dependencias con `npm install` solo si el volumen está vacío (el bind mount pisa lo instalado en build time, por eso no se instala en la imagen). `working_dir: /workspace/apps/backend-api`, comando `npm run dev` (el backend es el único proceso con puerto; `ai-engine` es librería consumida por él). Expone `3000`.
- **RAG (UC-011)**: directorios `rag/input` y `rag/history` como bind mounts (`RAG_INPUT_DIR`/`RAG_HISTORY_DIR`), para depositar ficheros desde el host y ejecutar `npm run ingest:rag` dentro del contenedor. `rag/examples` también se monta (`/workspace/rag/examples`): material de referencia reutilizable entre pruebas — para cada prueba se copia un ejemplo a `input` (p. ej. `docker compose exec node sh -c "cp /workspace/rag/examples/aritmetica-suma.txt /workspace/rag/input/"`). Como el embedder es determinista, el mismo ejemplo produce siempre el mismo embedding (verificado: distancia coseno 0 entre dos ingestas del mismo fichero), útil para validar el RAG entre tests.
- **Migración inicial**: sobre la base vacía del contenedor, `prisma migrate dev --name init` genera la migración formal en `database/migrations/` (directorio hoy vacío).
- **Verificación**: los 31 tests de integración (`npm run test:integration`) se ejecutan contra el Postgres del contenedor (comentario "sin Docker -- entorno mono-servidor" de `vitest.integration.config.ts` queda obsoleto y se actualiza).
- **Fuera de alcance en esta fase** (justificado en el handoff 2026-08-10): imágenes de producción multi-stage, CI/CD en `.github/workflows/`, containerización de `mobile-app` (su target nativo no se containeriza; solo se contemplaría el build web), y código consumidor de Redis.

## Consecuencias

### Positivas

- Entorno reproducible: una máquina limpia con Docker arranca el stack completo con un script (`scripts/setup/dev-env.ps1`).
- Desbloquea la migración formal de Prisma, pendiente desde hace dos sesiones.
- No se depende de la instalación local de Postgres/Redis (motivación original del usuario: el CI se demoraba por la instalación local de servicios).
- Coste de contexto: el contenedor `node` elimina la divergencia Windows↔Linux en el runtime de `backend-api`.

### Negativas / Riesgos

- El `node_modules` del contenedor (Linux) es distinto del del host (Windows): los comandos npm deben ejecutarse dentro del contenedor para el stack dev; el host conserva su instalación para desarrollo sin Docker.
- Windows + Docker Desktop: el bind mount del repo puede degradar rendimiento de file-watching (`tsx watch`); si aparece lag de recarga, valorar `CHOKIDAR_USEPOLLING=true` en el servicio `node`.
- El volumen `node_modules` puede quedar desincronizado si se cambia `package.json` sin reconstruir (se resuelve con `docker compose up --build -d node`).
- Las credenciales por defecto (`mathmind`/`mathmind`) son solo para desarrollo; en cualquier entorno compartido deben sobrescribirse vía `.env` (Security Agent, ADR-012).

## Trazabilidad

Handoff: `.ai/prompts/orchestrator.md` (2026-08-10, "Tercer handoff real"). Registrado en `.ai/prompts/architecture.md`.
