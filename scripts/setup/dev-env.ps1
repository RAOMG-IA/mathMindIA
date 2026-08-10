# ============================================================================
# scripts/setup/dev-env.ps1
# Bootstrap del entorno de desarrollo Docker de MathMind AI.
# Ver docs/ADR/ADR-016_entorno_docker.md
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/setup/dev-env.ps1
#
# Pasos: .env desde plantilla -> docker compose up -> migracion inicial en el
# contenedor -> tests de integracion contra el Postgres del contenedor.
# ============================================================================
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

# --- 0. Preflight: conflictos de puerto ------------------------------------
$conflict = Get-NetTCPConnection -State Listen -LocalPort 5432 -ErrorAction SilentlyContinue
if ($conflict) {
    Write-Host ""
    Write-Host "[preflight] ATENCION: hay un servicio escuchando en el puerto 5432" -ForegroundColor Yellow
    Write-Host "[preflight] (probablemente tu Postgres local, que bloqueaba prisma migrate dev por" -ForegroundColor Yellow
    Write-Host "[preflight]  collation -- STATUS.md #31/#33). Opciones:" -ForegroundColor Yellow
    Write-Host "[preflight]   1) Parar el servicio local  ->  docker compose up -d --build" -ForegroundColor Yellow
    Write-Host "[preflight]   2) Usar otro puerto para el contenedor ->  define POSTGRES_PORT=5433 en .env" -ForegroundColor Yellow
    Write-Host "[preflight] Continuando de todos modos; el paso de 'up' fallara si el puerto sigue ocupado." -ForegroundColor Yellow
    Write-Host ""
}

# --- 1. .env raiz (variables de compose) desde plantilla --------------------
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "[setup] .env creado desde .env.example."
    # Si hay un Postgres local en 5432, mueve el contenedor a 5433 en el .env para
    # que el primer `up` (y los siguientes) funcione sin editar nada a mano.
    if (Get-NetTCPConnection -State Listen -LocalPort 5432 -ErrorAction SilentlyContinue) {
        (Get-Content .env) -replace '^POSTGRES_PORT=.*', 'POSTGRES_PORT=5433' | Set-Content .env -Encoding UTF8
        Write-Host "[setup] Puerto 5432 ocupado por un Postgres local -> POSTGRES_PORT=5433 en .env."
    }
}

# --- 2. Levantar servicios --------------------------------------------------
Write-Host "[setup] docker compose up -d --build ..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "docker compose up fallo (revisa conflictos de puerto y el daemon de Docker)." }

# --- 3. Estado de los servicios ---------------------------------------------
Start-Sleep -Seconds 3
docker compose ps

# --- 4. Migracion inicial contra el Postgres del contenedor ------------------
# Desbloquea la migracion formal pendiente desde STATUS.md #31/#33.
# (Solo la primera vez; si la base ya migro, prisma migrate dev no crea nada nuevo.)

# En la PRIMERA subida el entrypoint del contenedor node (ADR-016) corre 'npm install'
# dentro del volumen node_modules (vacio), tarda ~2-3 min. Hay que esperar a que termine:
# lanzar prisma migrate contra un arbol a medio instalar es una carrera en el primer run.
Write-Host "[setup] Esperando a que el contenedor termine de instalar dependencias (solo primer run)..."
$installing = $true
for ($i = 0; $i -lt 40; $i++) {
    docker compose exec -T node pgrep -f 'npm (install|ci)' *> $null
    if ($LASTEXITCODE -ne 0) { $installing = $false; break }
    Start-Sleep -Seconds 5
}
if ($installing) {
    Write-Host "[setup] AVISO: npm install sigue activo tras 200s; continuando, el migrate podria fallar." -ForegroundColor Yellow
} else {
    Write-Host "[setup] Dependencias listas."
}

Write-Host "[setup] Generando migracion inicial contra el Postgres del contenedor..."
docker compose exec -T node npm run db:migrate -- --name init
if ($LASTEXITCODE -ne 0) { throw "prisma migrate dev fallo dentro del contenedor." }

# tsx watch NO se reinicia solo tras un crash de la app (se queda vivo esperando
# cambios de fichero): si el backend crasheo al arrancar sin tablas (primer `up`),
# hay que reiniciar el contenedor para que levante con las tablas ya migradas.
Write-Host "[setup] Reiniciando el contenedor node (backend arranca con las tablas migradas)..."
docker compose restart node
Start-Sleep -Seconds 5

# --- 5. Tests de integracion contra el Postgres del contenedor ----------------
Write-Host "[setup] Tests de integracion contra el Postgres del contenedor..."
docker compose exec -T node npm run test:integration
if ($LASTEXITCODE -ne 0) { throw "Los tests de integracion fallaron contra el contenedor." }

Write-Host ""
Write-Host "[setup] Entorno listo:" -ForegroundColor Green
$pgPort = ((Get-Content .env | Where-Object { $_ -like 'POSTGRES_PORT=*' } | Select-Object -First 1) -split '=')[1]
Write-Host "  - Postgres  : localhost:$pgPort (pgvector)" -ForegroundColor Green
Write-Host "  - Redis     : localhost:6379" -ForegroundColor Green
Write-Host "  - backend-api dev: http://localhost:3000 (docker compose logs -f node)" -ForegroundColor Green
Write-Host "  - RAG       : deposita ficheros en ./rag/input y ejecuta:" -ForegroundColor Green
Write-Host "               docker compose exec node npm run ingest:rag" -ForegroundColor Green
