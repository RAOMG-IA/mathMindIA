# ADR-018: CI/CD con GitHub Actions — E2E Playwright (web + mobile) y despliegue continuo a AWS

## Estado

Aceptado — E2E Playwright implementado y en verde (STATUS-053, 2026-08-11). El despliegue continuo a AWS: el bootstrap de OIDC (§9.5) **ya está aplicado** (rol IAM + variables de repo configuradas) — corrección 2026-08-19: la revisión anterior de este ADR decía erróneamente que el bootstrap seguía pendiente; en realidad el primer run con `quality`+`e2e` en verde (run #14) ya ejecutó el job `deploy` de verdad (no `skipped`) y llegó hasta el paso de credenciales AWS, donde falló por un desajuste real del trust policy (ver adenda 2026-08-19 abajo), no por falta de bootstrap. La plantilla ya está corregida (commit `bca407a`), pero **ese cambio no se autoaplica**: falta confirmar que alguien con acceso a la cuenta AWS haya actualizado el rol ya desplegado (`aws cloudformation update-stack` o `aws iam update-assume-role-policy` sobre `mathmindia-github-deploy`) y que un run de `main` complete `deploy` en verde de principio a fin.

## Contexto

El repositorio vive en GitHub (`RAOMG-IA/mathMindIA`, ver STATUS.md #18), pero no existía ninguna entrada CI/CD (`STATUS.md` #47 y ADR-016 lo registraron explícitamente como **fuera de alcance** en fases anteriores: `.github/workflows/` estaba vacío). La verificación punta a punta se hacía de forma manual con `curl`/navegador sobre `backend-api` real (`:3000`) y el bundle web de Expo (`:8081`), sin garantía reproducible en cada commit.

`mobile-app` es una única base de código Expo/`react-native-web` (ADR-015, ADR-001) que genera **los tres targets**: Android, iOS y Web. El usuario quiere, para DevOps en el proceso de CI, un **registro de capturas de pantalla tanto web como mobile** con Playwright para su validación e2e. Preguntado el alcance de la parte mobile, eligió **emulación de dispositivo sobre el build web** (no emulador nativo); y para el backend, **backend real en CI** (PostgreSQL real, no mock). Esta primera parte (Decisión §1-8) ya está implementada y es la que ejecuta hoy `.github/workflows/e2e.yml`.

### Contexto añadido (2026-08-15): la pila de despliegue ya existía, pero desconectada del CI

Independientemente de este ADR, `deploy/aws/` ya contenía una infraestructura AWS Free Tier funcional (`cloudformation.yml` + `user-data.sh`: VPC + EC2 `t2.micro` + Elastic IP + bootstrap Docker Compose, documentada en `docs/DEPLOY_AWS_FREE_TIER.md`) y `docker-compose.prod.yml` (postgres + redis + backend, imagen `docker/node/Dockerfile.prod`). Pero **ningún workflow la usaba**: actualizar la demo desplegada exigía SSH manual (`git pull` + `docker compose up -d --build` a mano, sección 7 de la guía), con el mismo riesgo de "verificación no reproducible en cada commit" que motivó §1-8 de este ADR, ahora trasladado a producción — un `main` verde en CI podía llevar horas o días sin reflejarse en la instancia real. El usuario pidió integrar esa pila ya generada en el pipeline en vez de crear una nueva.

## Decisión

Un pipeline **GitHub Actions** que construye el build web de `mobile-app`, levanta el **backend real** sobre un **servicio PostgreSQL**, y ejecuta **Playwright** contra él con dos *test projects* (`web` y `mobile`), produciendo capturas de pantalla como validación e2e y como artefactos.

### Decisiones concretas

1. **Motor E2E: Playwright** (no Appium/Detox). Un único framework cubre web y la emulación mobile sobre el build web de Expo usando *device descriptors* (`devices['iPhone 13']`, `devices['Pixel 7']`, …) que fijan viewport, UA, `isMobile`, `hasTouch` y DPR — con *test project* independiente por perfil.
   - **Alcance explícito**: la "parte mobile" que se valida es el **render responsive del build web** (una sola base de código Expo, ADR-015). El **binario nativo** (APK/IPA) queda **fuera de alcance**: su validación requeriría Appium/Detox sobre emulador, no Playwright — más lento y complejo en CI, no solicitado aquí (confirmado por el usuario vía AskUserQuestion). Es el mismo criterio "mobile container no se containeriza; solo se contemplaría el build web" ya fijado en ADR-016.
2. **Backend real en CI** (no mock, confirmado por el usuario): servicio **PostgreSQL** nativo de GitHub Actions (`pgvector/pgvector:pg16`, la misma imagen canónica de ADR-016/ADR-014, para que la extensión `vector` esté disponible si los integration tests o el RAG quieren ejecutarse) + arranque de `backend-api` real. El `webServer` de Playwright (o un job previo) levanta el backend; su `baseURL` apunta al API real del CI.
3. **Build web de la app**: `npx expo export --platform web` en `mobile-app`, servido estáticamente (reutiliza el flujo ya validado en STATUS.md #46/#47). `EXPO_PUBLIC_API_BASE_URL` (el prefijo que Expo inyecta en el bundle, ver `src/api/fetchClient.ts`) apunta al API del CI.
4. **Dos *test projects* en `playwright.config.ts`** (en `apps/mobile-app`):
   - `chromium-web`: viewport desktop, flujo principal.
   - `chromium-mobile-*`: device descriptors para representar "mobile" (uno por perfil relevante de ADR-015).
   - `baseURL` del build web; el backend como `webServer` o servicio entre jobs.
5. **Capturas como validación + registro**: 
   - *Claves funcionales* + `toHaveScreenshot()` (visual regression con *golden files*) como criterio de aprobación (REH — no usar el screenshot como único criterio, que genera falsos verdes/rojos; ver ADR-001 sobre el peso de la verificación automática).
   - `fullPage` y por breakpoint (`page.screenshot`) subidas como **artefactos** de CI (`actions/upload-artifact`) para auditoría visual de web y mobile.
6. **Flujo e2e objetivo (happy path sin IA)**: register → login → `GET /temas` → `POST /sessions` → `POST /answers` → `GET /users/me/statistics` → `POST /sessions/end`, contra el backend real. La ruta `/hints` (UC-003) **no** forma parte del flujo obligatorio del CI porque sin `AI_API_KEY`/`AI_BASE_URL` devuelve 403 a propósito (ver `main.ts`); se documenta, no se falsely-green.
7. **Secretos (ADR-012)**: ningún secreto se versiona. `JWT_SECRET` se inyecta como **secret de GitHub** (referencia `${{ secrets.* }}`, valor nunca en el workflow ni en `.env`); `AI_API_KEY`/`AI_BASE_URL` no se configuran en CI para el flujo core (opcional como secret si más adelante queremos e2e de hints).
8. **Coordinación con los tests existentes**: el pipeline no sustituye `turbo run test`/`lint`/`typecheck` (unitarios, DTO contra la TDD Enforcement Rule de ADR-003); los e2e Playwright son **una capa más sobre eso**, no un reemplazo. Decisión de orquestación: job de calidad (unit/lint/typecheck) y job e2e, paralelos o dependientes según coste.

### 9. Despliegue continuo a AWS (revisión 2026-08-15)

9.1. **Trigger: automático en `push` a `main`.** El job `deploy` de `.github/workflows/e2e.yml` declara `needs: [quality, e2e]` y `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` — nunca corre en `pull_request`, y solo corre si los dos jobs de validación terminaron en verde. Alternativa descartada: gate manual (`workflow_dispatch`) — se prioriza que un `main` verde se refleje solo en la demo, aceptando el riesgo residual de §Consecuencias.

9.2. **Autenticación AWS: OIDC, no claves de acceso.** `aws-actions/configure-aws-credentials@v4` asume un rol IAM (`role-to-assume: vars.AWS_DEPLOY_ROLE_ARN`) vía `id-token: write` — sin `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` de larga duración guardados como GitHub Secret (mismo criterio de ADR-012 de minimizar credenciales persistentes). El rol solo es asumible desde `repo:RAOMG-IA/mathMindIA:ref:refs/heads/main` (condición `sub` del trust policy, `deploy/aws/github-oidc-role.yml`); el ARN del rol se guarda como **variable** de repo, no como secret — un ARN no concede nada por sí solo, el control de acceso real está en esa condición.

9.3. **Mecanismo de actualización: SSM Run Command, no re-crear la pila.** `AWS::CloudFormation::Init`/`UserData` solo se ejecuta en el primer arranque de la instancia; un `update-stack` no vuelve a desplegar la app. El job `deploy` ejecuta por **AWS Systems Manager** (`aws ssm send-command` con el documento público `AWS-RunShellScript`) el mismo procedimiento que ya estaba documentado como manual en `docs/DEPLOY_AWS_FREE_TIER.md` §7 (`git fetch`+`reset --hard origin/main` + `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`), seguido de un poll a `/health` — ahora disparado por CI en vez de por SSH a mano.

9.4. **Nuevo permiso en la instancia EC2: `AmazonSSMManagedInstanceCore`.** `deploy/aws/cloudformation.yml` añade un `AWS::IAM::Role`+`InstanceProfile` a la instancia para que el SSM Agent (preinstalado en Amazon Linux 2023) acepte comandos — sin abrir ningún puerto nuevo en el `SecurityGroup`; el canal de control es la API de SSM, no la red pública.

9.5. **Bootstrap único, fuera del flujo por-push.** El proveedor OIDC + rol IAM (`deploy/aws/github-oidc-role.yml`) no se crea en cada push — es infraestructura de cuenta AWS aplicada una sola vez a mano (o por quien administre la cuenta), documentada en `docs/DEPLOY_AWS_FREE_TIER.md` §7c. Variables de repo GitHub requeridas antes de que `deploy` funcione: `AWS_DEPLOY_ROLE_ARN`, `AWS_EC2_INSTANCE_ID`, `AWS_ELASTIC_IP`, `AWS_REGION` (ninguna es secreta).

9.6. **Corrección de paso: `GitRef` por defecto.** `deploy/aws/cloudformation.yml` tenía `GitRef: master` por defecto, pero la rama real del repo es `main` (mismo nombre que el trigger de CD) — corregido en esta revisión para que el bootstrap inicial de una instancia nueva y el CD por push desplieguen la misma rama.

9.7. **Sin rollback automático ni blue-green (aceptado explícitamente).** La instancia es única y mutable: `docker compose up -d --build` sustituye el contenedor `backend` solo cuando el nuevo pasa su propio healthcheck (`depends_on: condition: service_healthy` en `docker-compose.prod.yml`), pero un fallo de arranque tras el build sí puede dejar la API caída hasta intervención manual (SSH, §7b de la guía) — no hay segunda instancia ni versión anterior a la que volver automáticamente.

### Fuera de alcance (esta fase)

- Validación del **binario nativo** Android/iOS (Appium/Detox): no es Playwright, requiere emulador — diferido.
- **Cobertura real** de código en CI (`@vitest/coverage-v8`): target declarado en ADR-017 §6, no instrumentado aquí.
- Consumer de **Redis** en CI (job `e2e`): no hay consumidor de código todavía (ADR-016); el servicio no entra en el e2e.
- **HTTPS/certificado/ALB**: la API sigue en HTTP puerto 3000 tras el despliegue continuo (mismo aviso MVP ya documentado en `docs/DEPLOY_AWS_FREE_TIER.md` §1); login/registro en claro es un riesgo ya señalado y diferido.
- **Entornos separados (staging vs. producción)**: una única instancia EC2 hace de "producción" del TFM; no hay un segundo entorno intermedio antes del despliegue automático.
- **Rollback automático / blue-green / autoscaling / múltiples instancias**: ver §9.7 — instancia única mutable, aceptado para el alcance de MVP de TFM.
- **Descubrimiento automático de instancia**: si se destruye/recrea la pila `mathmindia`, `AWS_EC2_INSTANCE_ID`/`AWS_ELASTIC_IP` cambian y hay que actualizar las variables de repo a mano.
- **Observabilidad/monitoring/alerting del despliegue**: el único indicador de fallo es el propio job de GitHub Actions en rojo; no hay notificación adicional (Slack, email) ni dashboard.

## Consecuencias

### Positivas

- **Validación reproducible**: cada PR/commit ejecuta el flujo completo register→…→end contra backend real (Postgres real), no solo a mano.
- **Evidencia visual**: capturas web y mobile versionadas como artefactos y golden files — aporte académico: el "registro de capturas" pedido se convierte en validación real (visual regression), no solo en screenshots decorativos.
- **Dos targets en un solo framework**: web desktop y emulación mobile sobre la misma base de código cierran el objetivo del usuario con un único runner.
- **Sin servicios nuevos**: aprovecha Postgres `pgvector` ya canónico (ADR-016) y el build web Expo ya validado — ningún servicio de base nueva no contemplado.
- **La demo converge sola con `main`**: un push que pasa quality+e2e queda reflejado en la instancia real en minutos, sin el paso manual de SSH que existía hasta esta revisión.
- **Reutiliza la IaC ya existente**: no se crea infraestructura de despliegue nueva (misma EC2/Docker Compose/CloudFormation de `deploy/aws/`), solo se conecta al pipeline — coste incremental de infraestructura: 0 $ (SSM no tiene coste adicional para instancias EC2 estándar).
- **Sin credenciales AWS de larga duración en GitHub**: OIDC + rol scoped a `main` reduce el radio de impacto de un secret de repo filtrado frente a unas access keys permanentes.

### Negativas / Riesgos

- **La parte mobile mide el build web, no el binario nativo**: una regresión que solo aparezca en el runtime nativo (ej. módulo nativo, layout seguro con notch real) no la capturaría el CI. Mitigación: documentarlo explícitamente (ADR y STATUS), y el dispositivo "web móvil" cubre el layout responsive.
- **Flaky en visual regression**: `toHaveScreenshot()` es sensible a antialiasing/anchors; mitigar con `maxDiffPixelRatio`/`toHaveScreenshot({ maxDiffPixels })` y capturas deterministas (desactivar animaciones `NeuralLoader`/partículas en modo test si interfieren — revisar `reduced motion`).
- **`expo export` coste**: cada ejecución bundle-a la web (~1300+ módulos, ver STATUS.md). Mitigado corriendo e2e solo en `pull_request`/`push` a ramas principales y reutilizando el job de build.
- **Backend real en CI requiere migración**: ejecutar `prisma migrate deploy` (o el comando canónico) contra el PostgreSQL del servicio de CI antes de arrancar; depende de que la migración formal exista (ADR-016 la desbloqueó). `prisma generate` explícito (mismo hallazgo de ADR-016 #2, el lockfile con `prisma.config.ts` no estándar no resuelve en `postinstall`).
- **Ningún `package.json` tiene aún `playwright`**: dependencia nueva en `mobile-app` (devDependency) y, si se quiere, el paquete de CLI `@playwright/test`. Coste de instalación/browsers (`npx playwright install`) en CI.
- ~~**Un `main` verde en CI no garantiza éxito en AWS**: `t2.micro` tiene 1 GB de RAM, muy por debajo del runner de GitHub Actions — un `docker compose build` que pasó en CI puede fallar por memoria en la instancia real.~~ **Resuelto**: se materializó en producción (`npm ci` tardó 628s y llegó a colgar la sesión SSM por falta de memoria en una `t3.micro`). El job `deploy` ahora construye y publica la imagen en GHCR desde el runner de GitHub Actions (mucha más RAM/CPU); la instancia solo hace `docker compose pull` + `up -d`, nunca compila el monorepo.
- **Instancia única mutable, sin rollback automático** (§9.7): un deploy que rompe en runtime real deja la API caída hasta intervención manual por SSH.
- **Superficie IAM nueva**: el rol `mathmindia-github-deploy` puede ejecutar comandos de shell arbitrarios en la instancia vía SSM si el repo (o el `main` del fork con ese nombre) queda comprometido — mismo nivel de confianza que ya existe en cualquier CD, documentado como trade-off aceptado, no mitigado con aprobación manual (decisión §9.1).
- **Bootstrap de cuenta AWS no versionado como parte del CI**: `deploy/aws/github-oidc-role.yml` se aplica a mano una vez (§9.5); si nunca se aplica, el job `deploy` falla en `sts:AssumeRoleWithWebIdentity` — no bloquea `quality`/`e2e`, pero requiere ese paso explícito antes de confiar en el CD.

## Trazabilidad

Handoff: `.ai/prompts/director.md` (STATUS-053). Implementación E2E (§1-8): DevOps Agent (ADR-002 RACI: Docker/CI/CD). Registrado en `.ai/prompts/director.md` y `.ai/prompts/devops.md`.

Revisión de despliegue continuo (§9, 2026-08-15): solicitada directamente por el usuario ("mejorar el ADR-018 e integrar la pila generada para el despliegue en AWS"), fuera del flujo Director/DevOps de agentes de este repo — decisiones de alcance (rescribir ADR-018 en vez de un ADR nuevo; trigger automático en `main`; autenticación OIDC) confirmadas explícitamente por el usuario antes de implementar. Pendiente registrar como entrada de trazabilidad en `docs/STATUS.md` (bloqueado por un conflicto de merge sin resolver en ese fichero al momento de esta revisión, ajeno a este cambio).

## Adenda 2026-08-19: trust policy OIDC condicionaba por `ref`, el job usa `environment`

**Contexto**: al revisar el historial real de GitHub Actions (no solo el texto de este ADR) se encontró que el run #14 fue el primero con `quality` y `e2e` en verde a la vez, y `deploy` sí llegó a ejecutarse (no `skipped`) — prueba de que el bootstrap de §9.5 (rol IAM + variables de repo) estaba correctamente aplicado, contra lo que decía la revisión anterior de este ADR. El job falló en el paso "Configurar credenciales AWS" con `Not authorized to perform sts:AssumeRoleWithWebIdentity`.

**Causa real**: `deploy/aws/github-oidc-role.yml` condicionaba el trust policy del rol por el claim `sub` en formato `repo:<org>/<repo>:ref:refs/heads/<branch>` (parámetro `AllowedRef`). Pero el job `deploy` de `.github/workflows/e2e.yml` declara `environment: production` — y un job de GitHub Actions con `environment:` cambia el formato real del claim `sub` del token OIDC a `repo:<org>/<repo>:environment:<nombre>`. La condición nunca coincidía, así que `AssumeRoleWithWebIdentity` fallaba siempre (no de forma intermitente), desde el primer día en que el job empezó a usar Environments.

**Fix**: `AllowedRef` sustituido por `AllowedEnvironment` (default `production`, igual que el job); la condición `StringLike` del trust policy pasa a comprobar `repo:${GitHubOrgRepo}:environment:${AllowedEnvironment}` (commit `bca407a`).

**Importante — este cambio de plantilla no se autoaplica**: es IaC declarativa; el rol ya desplegado en la cuenta AWS sigue con la condición vieja hasta que alguien con acceso ejecute `aws cloudformation update-stack` (si se usó el stack de `github-oidc-role.yml`) o `aws iam update-assume-role-policy` directo sobre `mathmindia-github-deploy`. Hasta que eso ocurra, `deploy` seguirá fallando en el mismo paso con el mismo error, aunque el código ya esté corregido. Pendiente confirmar un run de `main` con `deploy` completo en verde (incluye el health check público de la Elastic IP).