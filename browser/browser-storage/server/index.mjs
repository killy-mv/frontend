// A dependency-free static server with a few cookie endpoints.
//
// It exists for two reasons the demo cannot fake from a file:// page:
//   1. only a server can send `Set-Cookie`, which is how most real cookies appear
//   2. the Cache API needs real HTTP responses to store, so `/mini-site/` has to
//      be served over the network before it can be cached
//
//   node server/index.mjs   →   http://localhost:5180

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 5180
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

/** Turn a `Cookie:` request header into a plain object. */
function parseCookies(header = '') {
  const jar = {}
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    jar[pair.slice(0, eq).trim()] = decodeURIComponent(pair.slice(eq + 1).trim())
  }
  return jar
}

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

// --- routes -----------------------------------------------------------------

const routes = {
  // The server plants three cookies. Two are ordinary and readable by JS; the
  // third is HttpOnly, which is the interesting one — the browser stores it and
  // sends it back on every request, but `document.cookie` cannot see it.
  '/api/set-cookies'(req, res) {
    const sessionId = 'sess_' + Math.random().toString(36).slice(2, 10)
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': [
        `visitor_id=v-${Date.now()}; Path=/; Max-Age=3600; SameSite=Lax`,
        `theme=dark; Path=/; Max-Age=3600; SameSite=Lax`,
        `session=${sessionId}; Path=/; Max-Age=3600; SameSite=Lax; HttpOnly`,
      ],
    })
    res.end(
      JSON.stringify(
        {
          sent: ['visitor_id (readable)', 'theme (readable)', 'session (HttpOnly)'],
          note: 'The browser filed all three away without asking you. Only two are visible to JavaScript.',
        },
        null,
        2,
      ),
    )
  },

  // Echo back exactly what arrived in the `Cookie:` header, to prove the browser
  // is attaching cookies to requests on its own.
  '/api/whoami'(req, res) {
    const jar = parseCookies(req.headers.cookie)
    json(res, 200, {
      cookiesTheServerReceived: jar,
      count: Object.keys(jar).length,
      note: 'You never wrote this header. The browser attached it to the request by itself.',
    })
  },

  // Deleting a cookie is really "set the same cookie with Max-Age=0".
  '/api/clear-cookies'(req, res) {
    const expire = (name) => `${name}=; Path=/; Max-Age=0; SameSite=Lax`
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': [expire('visitor_id'), expire('theme'), `session=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`],
    })
    res.end(JSON.stringify({ cleared: ['visitor_id', 'theme', 'session'] }, null, 2))
  },
}

// --- static files -----------------------------------------------------------

async function serveStatic(url, res) {
  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/')) pathname += 'index.html'

  // normalize() collapses `..` so a request cannot climb out of public/
  const filePath = join(PUBLIC_DIR, normalize(pathname))
  if (!filePath.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const body = await readFile(filePath)
    const type = MIME[extname(filePath)] ?? 'application/octet-stream'
    res.writeHead(200, {
      'Content-Type': type,
      // The demo page itself must never come from the HTTP cache, or edits
      // appear not to take effect. The mini-site is left cacheable on purpose.
      'Cache-Control': pathname.startsWith('/mini-site/') ? 'no-cache' : 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`404 — ${pathname} not found`)
  }
}

// --- server -----------------------------------------------------------------

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const route = routes[url.pathname]
  if (route) return route(req, res)
  await serveStatic(url, res)
}).listen(PORT, () => {
  console.log(`browser-storage demo → http://localhost:${PORT}`)
  console.log(`mini-site to cache   → http://localhost:${PORT}/mini-site/`)
})
