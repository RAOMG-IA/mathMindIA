# Despliegue de MathMind AI en AWS Free Tier (MVP de pruebas)

Guía paso a paso para desplegar la aplicación completa (PostgreSQL + Redis + backend-api) en AWS **sin coste**, pensada para el TFM (MVP de pruebas). Toda la infraestructura está versionada como IaC en `deploy/aws/`.

## 1. Objetivo y arquitectura

Para un MVP de pruebas, la opción más económica y sencilla es **una sola instancia EC2 t2.micro** (dentro de la free tier: 750 horas/mes) que ejecuta **Docker Compose** con los tres servicios en contenedores.

```
                 Usuario / Movil (Expo)
                          │  HTTPS no, HTTP (MVP)
                          ▼
                 http://<ElasticIP>:3000
                          │
                 ┌────────┴─────────┐
                 │  EC2 t2.micro     │  ← free tier (0 $)
                 │  ┌─────────────┐  │
                 │  │ backend-api │  │  Node 22 + Express (imagen Dockerfile.prod)
                 │  └─────────────┘  │
                 │  ┌─────────────┐  │
                 │  │ postgres    │  │  pgvector/pgvector:pg16 (datos)
                 │  └─────────────┘  │
                 │  ┌─────────────┐  │
                 │  │ redis       │  │  redis:7-alpine
                 │  └─────────────┘  │
                 └──────────────────┘
        Elastic IP fija + SecurityGroup (SSH solo operador, :3000 publico)
```

Se eligió **EC2 + Docker Compose** en lugar de ECS Fargate o ALB porque:

- `t2.micro` entra en la **free tier** (750 h/mes gratis 12 meses).
- Todo vive en una sola instancia: sin costes de red, sin balanceador, sin RDS aparte.
- Reutiliza el `docker-compose.prod.yml` del repo (misma orquestación que en dev, modo producción).

> Aviso MVP: la API se sirve por **HTTP** en el puerto 3000. Para producción real haría falta HTTPS (ALB/ACM o Nginx + Let's Encrypt) porque login/registro envían la contraseña (ver hallazgo Security 2026-08-09). Para pruebas de TFM es aceptable.

---

## 2. Qué crea la plantilla CloudFormation (`deploy/aws/cloudformation.yml`)

| Recurso | Detalle | Coste free tier |
|---|---|---|
| VPC 10.0.0.0/16 + subnet pública + IGW + route table | Red aislada propia | 0 $ |
| SecurityGroup | SSH (22) solo desde `AdminIpCidr`, 3000 abierto | 0 $ |
| EC2 `t2.micro` | Amazon Linux 2023, disco **30 GB gp3** | 0 $ (free tier) |
| Elastic IP | IP pública fija asociada a la instancia | 0 $ (asociada a instancia encendida) |
| UserData bootstrap | Instala Docker, clona el repo, genera secretos, `docker compose up` | — |

Coste total estimado: **0 $/mes** mientras la instancia esté encendida y dentro de la free tier.

---

## 3. Requisitos previos

1. **Cuenta AWS** con free tier activa (la "Cuenta raíz" o una IAM con permisos `AmazonEC2FullAccess`, `AWSCloudFormationFullAccess`).
2. **Par de claves EC2**: en la consola `EC2 > Key Pairs > Create key pair` (formato `.pem`). Guárdalo; se usará para SSH.
3. **AWS CLI** opcional (para el despliegue por comando). Instalación: https://aws.amazon.com/cli/ y `aws configure`.
4. El repo **subido a GitHub** (público o privado). La plantilla clona `https://github.com/RAOMG-IA/mathMindIA.git` por defecto.

---

## 4. Despliegue (dos vías)

### 4a. Desde la consola (recomendado para la demo)

1. `CloudFormation > Create stack > With new resources (standard)`.
2. **Template source**: `Upload a template file` → sube `deploy/aws/cloudformation.yml`.
3. **Stack name**: `mathmindia`.
4. **Parameters**:
   - `KeyName`: tu par de claves EC2.
   - `AdminIpCidr`: `TU_IP_PÚBLICA/32` (busca "mi ip" en Google). Si pones `0.0.0.0/0` abres SSH al mundo (no recomendado).
   - `RepoUrl`: deja el valor por defecto.
   - `GitRef`: `master`.
   - `GitHubToken`: **vacío** si el repo es público; un PAT si es privado.
   - `AiApiKey` / `AiBaseUrl` / `AiModelName`: opcionales (sin ellos `POST /hints` falla, lo demás funciona).
   - `CorsAllowedOrigins`: vacío (clientes nativos/móvil no envían `Origin`).
5. `Next > Next > Next > Create stack`.
6. Espera a que el estado sea **`CREATE_COMPLETE`** (unos 4-6 min: instala Docker y hace build de la imagen).

### 4b. Desde AWS CLI

```powershell
aws cloudformation create-stack `
  --stack-name mathmindia `
  --template-body file://deploy/aws/cloudformation.yml `
  --parameters ParameterKey=KeyName,ParameterValue=TU_KEY `
               ParameterKey=AdminIpCidr,ParameterValue=TU_IP/32 `
  --capabilities CAPABILITY_IAM
```

---

## 5. Verificación

La pila devuelve en **Outputs**:

- `ApiUrl` → `http://<ElasticIP>:3000`
- `HealthCheck` → `http://<ElasticIP>:3000/health` debe responder `{"status":"ok"}`.
- `SshCommand` → `ssh -i tu.pem ec2-user@<ElasticIP>`

Comprobaciones:

```bash
curl http://<IP>/health                        # -> {"status":"ok"}
curl -X POST http://<IP>/auth/register -H "Content-Type: application/json" `
     -d '{"email":"a@b.com","password":"Passw0rd!","academicLevel":"Primaria"}'
```

Si algo falla, mira el log del bootstrap:

```bash
ssh -i tu.pem ec2-user@<IP>
sudo tail -100 /var/log/mathmindia-bootstrap.log
```

---

## 6. Conectar la app móvil (Expo)

En `apps/mobile-app/.env` pon la URL de la API antes de arrancar Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<ElasticIP>:3000
```

> Nota: para pruebas en **Android emulador** la IP sería `10.0.2.2`; en **dispositivo físico** usa la IP pública de AWS y asegúrate de estar en la misma red o de que el SecurityGroup lo permita (3000 ya está abierto).

---

## 7. Actualizar la aplicación

### 7a. Automático (CD, ADR-018) — recomendado

Cada `push` a `main` que pasa `quality`+`e2e` en el workflow `CI / CD` (`.github/workflows/e2e.yml`) despliega solo, sin SSH: el job `deploy` asume un rol AWS por OIDC (sin claves de larga duración en GitHub) y ejecuta por **SSM Run Command** el mismo `git pull` + `docker compose up -d --build` que la vía manual, terminando con un `curl /health`. Requiere el bootstrap único de la sección 7c antes de la primera vez.

### 7b. Manual (SSH) — para depurar o cuando el CD no aplica

El bootstrap usa `git pull` si el repo ya existe, así que en la instancia:

```bash
ssh -i tu.pem ec2-user@<IP>
cd /opt/mathmindia
sudo git pull
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### 7c. Bootstrap único del CD (una sola vez, antes de activar el `deploy` en `main`)

El job `deploy` necesita un rol IAM que GitHub Actions pueda asumir por OIDC — no se crea en cada push, es infraestructura de una sola vez sobre la cuenta AWS:

1. Con la pila `mathmindia` (sección 4) ya `CREATE_COMPLETE`, copia su Output `InstanceId`.
2. Despliega `deploy/aws/github-oidc-role.yml`:
   ```bash
   aws cloudformation create-stack \
     --stack-name mathmindia-github-oidc \
     --template-body file://deploy/aws/github-oidc-role.yml \
     --parameters ParameterKey=Ec2InstanceArn,ParameterValue=arn:aws:ec2:TU_REGION:TU_ACCOUNT_ID:instance/i-XXXXXXXX \
     --capabilities CAPABILITY_NAMED_IAM
   ```
3. En GitHub: `Settings > Secrets and variables > Actions > Variables` (son variables, no secrets — ninguna es sensible por sí sola; el control de acceso real está en la condición `sub` del rol, limitada a `repo:RAOMG-IA/mathMindIA:ref:refs/heads/main`):
   - `AWS_DEPLOY_ROLE_ARN`: Output `RoleArn` del stack anterior.
   - `AWS_EC2_INSTANCE_ID`: Output `InstanceId` de la pila `mathmindia`.
   - `AWS_ELASTIC_IP`: Output `PublicIp` de la pila `mathmindia`.
   - `AWS_REGION`: región donde se desplegó todo (p. ej. `eu-west-1`).
4. Siguiente `push` a `main` con `quality`+`e2e` en verde ya despliega solo.

**Si se destruye/recrea la instancia EC2** (nueva pila `mathmindia`), `AWS_EC2_INSTANCE_ID`/`AWS_ELASTIC_IP` cambian y hay que actualizar las variables de repo a mano — no hay descubrimiento automático de instancia (fuera de alcance, ver ADR-018).

---

## 8. Coste y apagado

- **Mientras está encendida**: 0 $/mes (free tier). El EIP asociado a instancia encendida es gratis.
- **Para ahorrar aún más** (no es necesario): para la instancia (`EC2 > Instance > Stop`) cuando no se pruebe; el EIP deja de ser gratis si la instancia está parada (se cobra ~0,005 $/h) — o libera la pila.
- **Eliminar todo**: borra la pila de CloudFormation (libera EC2, EIP, VPC, discos).

**Controles para no llevarte sorpresas**: activa `Billing > Budgets` (alerta a 0,50 $) y `Cost Explorer`.

---

## 9. Ficheros de esta infraestructura

| Fichero | Función |
|---|---|
| `deploy/aws/cloudformation.yml` | IaC: VPC + SG + EC2 t2.micro + EIP + IAM/SSM + UserData |
| `deploy/aws/user-data.sh` | Script de bootstrap (copia de referencia del UserData) |
| `deploy/aws/github-oidc-role.yml` | IaC del bootstrap único de CD: OIDC provider + rol IAM para GitHub Actions (ADR-018) |
| `docker/node/Dockerfile.prod` | Imagen de producción multi-stage (turbo build + prisma generate) |
| `docker-compose.prod.yml` | Orquestación producción: postgres + redis + backend |
| `.github/workflows/e2e.yml` | Job `deploy`: CD automático a esta instancia tras `quality`+`e2e` en verde en `main` (ADR-018) |

---

## 10. Puntos para la presentación del TFM

1. **IaC desde el inicio**: la infraestructura está versionada (`cloudformation.yml`), no hecha "a mano" en la consola → reproducible y revisable.
2. **Coste cero**: decisión consciente de EC2 t2.micro free tier para un MVP de pruebas, sin servicios gestionados caros (RDS/ECS) porque la carga prevista es mínima.
3. **Paridad dev/prod**: mismo `Docker Compose` que en desarrollo, imagen multi-stage con `turbo build` y `prisma migrate deploy` automático en arranque.
4. **Seguridad**: secretos generados en la instancia con `chmod 600` (JWT, password de Postgres), SSH restringido por IP, y reconocimiento explícito de que HTTP solo es válido para MVP (HTTPS pendiente para producción).
5. **CD sin claves de larga duración (ADR-018)**: GitHub Actions despliega por OIDC + SSM Run Command, no por SSH con una clave privada guardada como secret — la superficie de riesgo si el repo se filtra es mucho menor que unas credenciales `.pem`/access keys permanentes.
