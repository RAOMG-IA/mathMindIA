# Contenedor de desarrollo del monorepo MathMind AI (backend-api + ai-engine + packages).
# Ver docs/ADR/ADR-016_entorno_docker.md.
#
# El npm install NO se hace en build time: el bind mount del repo en tiempo de
# ejecucion pisaria lo instalado. Se delega al entrypoint sobre el volumen
# nombrado /workspace/node_modules (deps Linux, aislado del node_modules Windows
# del host). Imagen base alineada con .nvmrc (Node 22).

FROM node:22

WORKDIR /workspace

COPY docker/node/entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN chmod +x /usr/local/bin/dev-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/dev-entrypoint.sh"]
