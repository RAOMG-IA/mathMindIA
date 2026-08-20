# Referencia de configuración: despliegue AWS + GitHub Actions

> Estado real de la infraestructura desplegada y las relaciones entre GitHub y AWS,
> capturado tras la sesión de depuración del CD (2026-08-19/20). No es una guía paso a
> paso (eso es [DEPLOY_AWS_FREE_TIER.md](DEPLOY_AWS_FREE_TIER.md)) — es el mapa de "qué
> apunta a qué" para no repetir el trabajo de reconstruir estas relaciones a mano.
>
> Los IDs concretos (instancia, IP, ARNs) cambian cada vez que se recrea la pila de
> cómputo desde cero. Trátalos como el valor *a fecha de este documento*, no como una
> promesa de que seguirán siendo así — antes de actuar sobre ellos, verifica el estado
> real (`aws cloudformation describe-stacks`, `aws ec2 describe-instances`, variables en
> GitHub) en vez de asumir que este documento sigue vigente.

> **Pendiente de aplicar manualmente (sesión 2026-08-20, frontend web)**: el
> `SecurityGroup` de `cloudformation.yml` ya declara el puerto 8081 público, pero la pila
> `mathMindIA2` desplegada NO lo tiene hasta que se ejecute `aws cloudformation
> update-stack` sobre ella (ver §2). Hasta entonces, `deploy-mobile-web` (§5) despliega el
> contenedor pero queda inalcanzable desde fuera de la VPC.

## 0. Frontend web (mobile-app) — resumen de lo añadido

Se añadió un tercer servicio a `docker-compose.prod.yml`, `mobile-web`, que sirve el build
web de Expo (`apps/mobile-app`) exportado como estáticos. Sigue el mismo patrón que el
backend: se construye en GitHub Actions y se publica en GHCR; el EC2 solo hace `pull`.

| Pieza | Detalle |
|---|---|
| Imagen | `ghcr.io/raomg-ia/mathmindia-mobile-web` (tags `latest` y `${{ github.sha }}`) |
| Dockerfile | `docker/mobile-web/Dockerfile.prod` — build de Expo (`npx expo export --platform web`) + runtime `node:22-slim` sirviendo `dist/` con `apps/mobile-app/e2e/serve.mjs` (servidor estático ya existente para E2E, cero dependencias nuevas) |
| Puerto público | `8081` (mismo que usa el proyecto en dev/E2E vía `E2E_WEB_BASE_URL`) |
| `EXPO_PUBLIC_API_BASE_URL` | Se hornea en el bundle JS **en build time** (Expo solo expone `EXPO_PUBLIC_*` al cliente durante el export, no en runtime) como `http://${AWS_ELASTIC_IP}:3000`. Si el Elastic IP cambia (pila de cómputo recreada), hay que reconstruir y republicar esta imagen — no basta con reiniciar el contenedor. |
| Healthcheck del contenedor | En Node puro (`node -e "require('http').get(...)"`), no `wget`/`curl` — verificado que `node:22-slim` no los trae, a diferencia del `node:22` completo que usa el backend. |
| `WebUrl` | Nuevo output en `cloudformation.yml`: `http://${ElasticIp}:8081` |

## 1. Mapa de dependencias (qué hay que sincronizar con qué)

```
deploy/aws/cloudformation.yml (pila de cómputo)
  └─ crea EC2 Instance + Elastic IP
       │
       ├──> AWS_EC2_INSTANCE_ID  (variable de repo GitHub, Settings → Actions → Variables)
       │      usada por: .github/workflows/e2e.yml, jobs `sync-repo`/`deploy-backend`/
       │      `deploy-mobile-web`, step SSM send-command
       │
       ├──> AWS_ELASTIC_IP  (variable de repo GitHub)
       │      usada por: .github/workflows/e2e.yml — build-arg EXPO_PUBLIC_API_BASE_URL
       │      (job `deploy-mobile-web`), patch de CORS_ALLOWED_ORIGINS (job `sync-repo`),
       │      y los steps "Verificar health/salud pública" de ambos jobs de deploy
       │
       └──> deploy/aws/github-oidc-role.yml, parámetro Ec2InstanceArn
              (acota el `ssm:SendCommand` del rol IAM a ESA instancia exacta)
              → requiere `aws cloudformation update-stack` sobre la pila del rol
                cada vez que la pila de cómputo se recrea (nuevo InstanceId)

deploy/aws/github-oidc-role.yml (pila IAM/OIDC)
  └─ crea OIDC Provider + Role mathmindia-github-deploy
       │
       ├──> AWS_DEPLOY_ROLE_ARN  (variable de repo GitHub)
       │      usada por: aws-actions/configure-aws-credentials en los jobs `sync-repo`,
       │      `deploy-backend` y `deploy-mobile-web` (cada uno pide su propio token OIDC)
       │
       └─ trust policy condiciona el claim `sub` del token OIDC por:
              GitHubOrgId + GitHubRepoId (inmutables, solo cambian si se transfiere/
              renombra el repo) + AllowedEnvironment (debe coincidir EXACTO con el
              `environment:` de CADA job que pida credenciales -- `sync-repo`,
              `deploy-backend` y `deploy-mobile-web` declaran `environment: production`
              por separado, los tres deben mantenerlo si se renombra)
```

**Regla operativa**: si se reconstruye la pila de cómputo (`cloudformation.yml`) desde
cero, hay **tres cosas que actualizar**, no solo una:
1. `AWS_EC2_INSTANCE_ID` y `AWS_ELASTIC_IP` en GitHub (Settings → Actions → Variables).
2. El parámetro `Ec2InstanceArn` de `github-oidc-role.yml` (default en el propio fichero
   + `update-stack` en AWS) para que el rol pueda seguir mandando `ssm:SendCommand` a la
   instancia nueva.
3. Nada más en el lado OIDC — el `sub` (org/repo/environment) no cambia con la instancia.

## 2. Recursos AWS actuales

| Recurso | Valor (a fecha de este documento) |
|---|---|
| Cuenta AWS | `276023597631` |
| Región | `eu-central-1` |
| Pila de cómputo | `mathMindIA2` (`cloudformation.yml`) — `CREATE_COMPLETE` |
| Pila IAM/OIDC | `mathMindIA2github` (`github-oidc-role.yml`) — `CREATE_COMPLETE` |
| Pila huérfana | `mathMindIA1` — **`DELETE_FAILED`** (el `PublicSubnet` no se pudo borrar por dependencias residuales de la instancia vieja). Pendiente: `aws cloudformation delete-stack --stack-name mathMindIA1 --region eu-central-1` para limpiar VPC/IGW/SG huérfanos (no generan coste, pero ensucian la cuenta). |
| Instancia EC2 | `i-0045bab249ce65a15` (`t3.micro`, AL2023 x86_64) |
| Elastic IP | `3.79.173.203` (`eipalloc-01d97a897e58e3ba3`) |
| SecurityGroup | SSH (22) + API (3000) + **Web (8081, añadido en plantilla, pendiente `update-stack` sobre la pila desplegada — ver aviso al inicio del documento)** |
| OIDC Provider | `arn:aws:iam::276023597631:oidc-provider/token.actions.githubusercontent.com` |
| Rol IAM (asumido por GitHub Actions) | `arn:aws:iam::276023597631:role/mathmindia-github-deploy` |
| Rol IAM (perfil del EC2, SSM) | `mathmindia-ec2-ssm-role` (`AmazonSSMManagedInstanceCore`) |
| Usuario IAM de diagnóstico | `arn:aws:iam::276023597631:user/deploy` — permisos de solo lectura (CloudFormation/IAM/EC2 describe); **no** tiene `ssm:SendCommand` ni `iam:UpdateAssumeRolePolicy` (mínimo privilegio deliberado) |

### Trust policy del rol `mathmindia-github-deploy`

```json
"StringLike": {
  "token.actions.githubusercontent.com:sub":
    "repo:RAOMG-IA@290325480/mathMindIA@1325331750:environment:production"
}
```

- `RAOMG-IA@290325480` / `mathMindIA@1325331750`: GitHub incluye los **IDs numéricos
  inmutables** de organización y repo en el claim `sub` (protección contra reclamar el
  rol tras renombrar/borrar y recrear un repo con el mismo nombre). Solo cambian si el
  repo se transfiere o se recrea desde cero.
- `environment:production`: un job de GitHub Actions con `environment:` cambia el
  formato del `sub` de `ref:refs/heads/<rama>` a `environment:<nombre>` — tiene que
  coincidir exacto con `environment: production`, declarado por separado en cada uno de
  los jobs `sync-repo`, `deploy-backend` y `deploy-mobile-web` de `e2e.yml` (§5).

## 3. Variables y secrets de GitHub (Settings → Secrets and variables → Actions)

| Nombre | Tipo | Valor / origen | Usado por |
|---|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Variable | `arn:aws:iam::276023597631:role/mathmindia-github-deploy` | `configure-aws-credentials` (OIDC) |
| `AWS_REGION` | Variable | `eu-central-1` | `configure-aws-credentials`, llamadas AWS CLI |
| `AWS_EC2_INSTANCE_ID` | Variable | `i-0045bab249ce65a15` | `aws ssm send-command --instance-ids` |
| `AWS_ELASTIC_IP` | Variable | `3.79.173.203` | Health checks finales de `deploy-backend`/`deploy-mobile-web`, build-arg de `mobile-web` y patch de CORS en `sync-repo` (ver §1) |
| `GHCR_PUSH_TOKEN` | Secret | PAT **clásico**, scope único `write:packages` | `docker/login-action` para publicar en GHCR (jobs `deploy-backend` y `deploy-mobile-web`) |

`CORS_ALLOWED_ORIGINS` **no** es una variable de GitHub: vive solo en el `.env.prod` de la
instancia. Antes solo se fijaba una vez, al primer arranque (bootstrap, parámetro
`CorsAllowedOrigins` de `cloudformation.yml`, por defecto vacío). Desde que existe el
frontend web, el job `sync-repo` (§5) la **reescribe en cada deploy** vía `sed` a
`http://${AWS_ELASTIC_IP}:8081` — así el backend acepta peticiones de navegador desde el
frontend sin depender de que el bootstrap se haya ejecutado con el valor correcto.

### Por qué `GHCR_PUSH_TOKEN` y no `GITHUB_TOKEN`

La política de *Workflow permissions* de la organización **RAOMG-IA** está fijada en
"Read repository contents and packages permissions" (solo lectura) y **no es
overrideable a nivel de repo** ni desde `permissions:` en el YAML — el owner de la org
no ha delegado ese control. Se usa un PAT clásico dedicado en su lugar. Nota: los PATs
**fine-grained** de GitHub todavía no soportan el permiso de Packages/GHCR; tiene que
ser un token clásico.

## 4. GitHub Container Registry (GHCR)

- Imágenes:
  - `ghcr.io/raomg-ia/mathmindia-backend` (tags `latest` y `${{ github.sha }}`)
  - `ghcr.io/raomg-ia/mathmindia-mobile-web` (tags `latest` y `${{ github.sha }}`) —
    añadida en la sesión del frontend web (§0)
- Se construyen y publican en los jobs `deploy-backend` / `deploy-mobile-web` de
  `e2e.yml` (runner de GitHub, no en el EC2 — la `t3.micro` de 1 GiB no da para compilar
  el monorepo, ver ADR-018).
- **Pendiente manual recurrente (por cada imagen nueva)**: un paquete GHCR se crea
  **privado** la primera vez que se publica, aunque el repo sea público. Tras el primer
  push que lo cree, hay que entrar a
  `github.com/orgs/RAOMG-IA/packages/container/<nombre-imagen>/settings` y cambiar
  Visibility a **Public** — si no, el `docker compose pull` del EC2 falla sin
  credenciales configuradas ahí (deliberado: se prefirió no gestionar auth en el EC2).
  Es un paso de una sola vez por imagen, no por cada push. Ya se hizo para
  `mathmindia-backend`; **pendiente para `mathmindia-mobile-web`** tras su primer push.

## 5. CI/CD: deploy dividido en jobs independientes (backend / mobile-web)

Añadido en la misma sesión que el frontend web (§0). Antes había un único job `deploy`
que construía y desplegaba backend y mobile-web en serie: si el build de uno fallaba,
bloqueaba también al otro. Ahora `e2e.yml` tiene tres jobs tras `quality`+`e2e`:

```
sync-repo          -- una sola vez: git fetch/reset --hard + sed CORS_ALLOWED_ORIGINS
  ├──> deploy-backend      -- build+push imagen backend, SSM `compose pull/up -d backend`
  └──> deploy-mobile-web   -- build+push imagen mobile-web, SSM `compose pull/up -d mobile-web`
```

`deploy-backend` y `deploy-mobile-web` corren en paralelo (ambos dependen solo de
`sync-repo`, no entre sí) y son independientes: el fallo de uno no bloquea al otro. El
`git reset --hard` y el patch de CORS se sacaron a un job compartido (`sync-repo`)
deliberadamente — si cada deploy hiciera su propio `git reset --hard` sobre
`/opt/mathmindia` y corrieran en paralelo, podrían pisarse entre sí sobre el mismo
checkout. Los tres jobs (`sync-repo`, `deploy-backend`, `deploy-mobile-web`) piden su
propio token OIDC por separado (cada uno declara `environment: production`).

## 6. Cadena de bugs encontrados en esta sesión (por si reaparecen)

Útil para no re-diagnosticar lo mismo si se reconstruye la infraestructura desde cero:

1. **OIDC "Not authorized"**: trust policy condicionaba por `ref:` cuando el job ya
   usaba `environment:` → cambiado a `environment:production`. Después se descubrió que
   además faltaban los IDs inmutables de org/repo en el `sub` (ver §2).
2. **`ssm:SendCommand` AccessDenied**: el `Ec2InstanceArn` de la trust policy apuntaba a
   una instancia ya terminada tras reconstruir la pila de cómputo — hay que
   resincronizarlo (§1).
3. **`git: command not found`**: el `UserData` de `cloudformation.yml` instalaba
   `docker` pero nunca `git`, pese a usarlo para clonar/actualizar el repo.
4. **`unknown flag: --env-file`**: Amazon Linux 2023 no trae el plugin `docker compose`
   por `dnf` (a diferencia de `docker-compose-plugin` en apt/Ubuntu) — se instala el
   binario oficial a mano en `/usr/local/lib/docker/cli-plugins/`.
5. **`compose build requires buildx`**: Compose v2 reciente delega el build en
   `buildx`, tampoco incluido por `dnf`. En vez de instalar también `buildx` en la
   `t3.micro`, se resolvió de raíz: la imagen se construye en GitHub Actions y se
   publica en GHCR; el EC2 solo hace `pull` (ver §4). Esto también evitó el problema de
   fondo: compilar el monorepo (`npm ci` + `tsc` vía turbo) en una instancia de 1 GiB
   tardó 628s y llegó a colgar la sesión SSM por falta de memoria.
6. **GHCR push 403 / permisos de organización**: ver §3.

## 7. Referencias

- Guía paso a paso de despliegue: [DEPLOY_AWS_FREE_TIER.md](DEPLOY_AWS_FREE_TIER.md)
- Decisión de arquitectura del CD: [ADR-018](ADR/ADR-018_ci_cd_playwright_e2e.md)
- Plantillas: `deploy/aws/cloudformation.yml`, `deploy/aws/github-oidc-role.yml`,
  `deploy/aws/user-data.sh` (copia de referencia del `UserData`, no se ejecuta sola)
- Workflow: `.github/workflows/e2e.yml` (jobs `sync-repo`, `deploy-backend`,
  `deploy-mobile-web`)
- Dockerfile del frontend: `docker/mobile-web/Dockerfile.prod`
