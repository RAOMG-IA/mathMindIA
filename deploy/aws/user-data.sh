#!/bin/bash
# Bootstrap de MathMind AI en EC2 (AWS Free Tier, t2.micro). Ejecutado por
# CloudFormation como UserData en el primer arranque. Ver docs/DEPLOY_AWS_FREE_TIER.md.
# Seguridad: no escribe secretos en el log; usa variables que inyecta la plantilla.
set -euo pipefail

exec > >(tee /var/log/mathmindia-bootstrap.log) 2>&1

echo "[bootstrap] Inicio $(date -u)"

# 1) Docker + plugin compose (Amazon Linux 2023).
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
if ! command -v docker; then
  echo "[bootstrap] ERROR: docker no disponible" >&2
  exit 1
fi
docker version

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

# 4) Build y despliegue con compose de produccion.
echo "[bootstrap] docker compose build + up -d"
cd "$APP_DIR"
sudo docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --build

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
