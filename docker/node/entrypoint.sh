#!/bin/sh
# Entrypoint del contenedor de desarrollo (docker/node). Ver ADR-016.
# Instala dependencias solo si el volumen nombrado de node_modules esta vacio
# (primera subida o tras reconstruccion), regenera el cliente de Prisma
# (Prisma 7: generacion explicita, no automatica via postinstall fiable),
# restaura el working_dir del servicio y delega en el comando.
set -e

INITIAL_DIR="$(pwd)"

if [ ! -d /workspace/node_modules ] || [ -z "$(ls -A /workspace/node_modules 2>/dev/null)" ]; then
  echo "[dev-entrypoint] node_modules vacio en contenedor -> npm install + prisma generate"
  cd /workspace
  npm install
  echo "[dev-entrypoint] generando cliente de Prisma..."
  cd apps/backend-api
  npm run db:generate
fi

cd "$INITIAL_DIR"

exec "$@"
