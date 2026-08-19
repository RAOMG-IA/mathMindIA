#!/bin/bash
# Bootstrap de MathMind AI en EC2 (AWS Free Tier, t3.micro). Ejecutado por
# CloudFormation como UserData en el primer arranque. Ver docs/DEPLOY_AWS_FREE_TIER.md.
# Seguridad: no escribe secretos en el log; usa variables que inyecta la plantilla.
set -euo pipefail

exec > >(tee /var/log/mathmindia-bootstrap.log) 2>&1

echo "[bootstrap] Inicio $(date -u)"

# 1) Docker + git (AL2023 no trae ninguno de los dos por dnf con lo minimo necesario).
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
if ! command -v docker; then
  echo "[bootstrap] ERROR: docker no disponible" >&2
  exit 1
fi
docker version

# AL2023 tampoco trae el plugin "docker compose" via dnf (a diferencia de
# docker-compose-plugin en apt/Ubuntu) -- se instala el binario oficial en una ruta de
# cli-plugins de sistema para que funcione tambien con sudo (root). No hace falta buildx:
# la imagen se construye en GitHub Actions (ver .github/workflows/e2e.yml, job `deploy`) y
# se publica en GHCR; esta instancia solo hace `pull` + `up -d`.
DOCKER_CLI_PLUGINS_DIR=/usr/local/lib/docker/cli-plugins
sudo mkdir -p "$DOCKER_CLI_PLUGINS_DIR"
sudo curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o "$DOCKER_CLI_PLUGINS_DIR/docker-compose"
sudo chmod +x "$DOCKER_CLI_PLUGINS_DIR/docker-compose"
docker compose version

# 2) Clonar el repo del monorepo. La URL la inyecta CloudFormation.
#    Si es privado, usa un token de acceso (parámetro GitHubToken, NoEcho).
REPO_URL="${REPO_URL}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
APP_DIR=/opt/mathmindia
sudo mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  echo "[bootstrap] Repo ya presente -> git pull"
  sudo git -C "$APP_DIR" fetch --all
  sudo git -C "$APP_DIR" reset --hard "origin/${GIT_REF}"
else
  echo "[bootstrap] Clonando ${REPO_URL}"
  if [ -n "$GITHUB_TOKEN" ]; then
    # Peticiones autenticadas -> https://x-access-token:TOKEN@github.com/...
    AUTH_URL="https://x-access-token:${GITHUB_TOKEN}@$(echo "$REPO_URL" | sed 's|https://||')"
    sudo git clone --branch "$GIT_REF" --depth 1 "$AUTH_URL" "$APP_DIR"
  else
    sudo git clone --branch "$GIT_REF" --depth 1 "$REPO_URL" "$APP_DIR"
  fi
fi

# 3) Generar secretos (solo si no existen): JWT_SECRET y password de Postgres.
ENV_FILE="$APP_DIR/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
  echo "[bootstrap] Generando secretos en .env.prod (chmod 600)"
  PG_PASS="$(openssl rand -hex 16)"
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=mathmind
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=mathmindia
JWT_SECRET=$JWT_SECRET
AI_API_KEY=${AI_API_KEY:-}
AI_BASE_URL=${AI_BASE_URL:-}
AI_MODEL_NAME=${AI_MODEL_NAME:-}
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-}
EOF
  sudo chmod 600 "$ENV_FILE"
else
  echo "[bootstrap] .env.prod ya existe -> no se regenera"
fi

# 4) Pull de la imagen (construida y publicada por GitHub Actions) + despliegue.
echo "[bootstrap] docker compose pull + up -d"
cd "$APP_DIR"
sudo docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml pull
sudo docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d

# 5) Esperar healthcheck.
echo "[bootstrap] Esperando /health en :3000"
for i in $(seq 1 60); do
  if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    echo "[bootstrap] API OK tras ${i}x5s"
    exit 0
  fi
  sleep 5
done

echo "[bootstrap] ERROR: la API no respondio a /health" >&2
sudo docker compose -f docker-compose.prod.yml logs backend || true
exit 1
