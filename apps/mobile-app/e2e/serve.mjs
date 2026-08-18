// Servidor estatico minimo para los tests E2E (Playwright WebServer) -- sirve el build web de
// Expo exportado en ./dist sin dependencias de terceros (solo node:http/fs/path). Evita meter
// `serve`/`http-server` solo para el CI. ADR-018.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = new URL('./dist/', import.meta.url)
const PORT = Number(process.env.E2E_WEB_PORT ?? 8081)
const HOST = process.env.E2E_WEB_HOST ?? 'localhost'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'
    const file = normalize(join(ROOT.pathname, pathname))
    if (!file.startsWith(ROOT.pathname)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    let data
    try {
      data = await readFile(file)
    } catch {
      // SPA fallback: rutas de Expo Router sin fichero -> index.html
      data = await readFile(new URL('index.html', ROOT))
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch (error) {
    res.writeHead(500).end(String(error))
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[e2e:serve] serving ./dist on http://${HOST}:${PORT}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)