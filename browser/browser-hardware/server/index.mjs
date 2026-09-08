// A dependency-free static server for the hardware demo.
//
// It exists for three reasons the demo cannot fake from a file:// page:
//   1. almost every hardware API requires a *secure context*, and http://localhost
//      counts as one while file:// does not
//   2. `Permissions-Policy` is a response header — a page cannot lock itself down
//      from JavaScript, only a server can
//   3. the iframe delegation demo needs a *second origin*, which is what the
//      extra listener on 5183 is for: same files, different port, different origin
//
//   node server/index.mjs   →   http://localhost:5182
//
// Drop a self-signed `server/cert.pem` + `server/key.pem` next to this file and
// it serves HTTPS instead, which is the only way to reach the phone-only APIs
// from an actual phone. The README has the openssl line.

import { createServer } from 'node:http'
import { createServer as createSecureServer } from 'node:https'
import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 5182
const ALT_PORT = 5183 // a second origin for the iframe delegation demo
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

// An empty allowlist — `camera=()` — denies the feature to this document and to
// everything nested inside it, with no way for script to opt back in. This is
// what a real site sends so that an XSS bug cannot reach the camera.
const LOCKED_POLICY = 'camera=(), microphone=(), geolocation=(), gyroscope=(), accelerometer=(), usb=(), serial=(), hid=(), bluetooth=()'

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  let pathname = decodeURIComponent(url.pathname)

  // /locked/ serves the *same file* as /sandbox/, with one header added. That
  // header is the entire difference, which is the point of the panel.
  const locked = pathname === '/locked' || pathname.startsWith('/locked/')
  if (locked) pathname = '/sandbox/index.html'
  if (pathname.endsWith('/')) pathname += 'index.html'

  // normalize() collapses `..` so a request cannot climb out of public/
  const filePath = join(PUBLIC_DIR, normalize(pathname))
  if (!filePath.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const body = await readFile(filePath)
    const headers = {
      'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    }
    if (locked) headers['Permissions-Policy'] = LOCKED_POLICY
    res.writeHead(200, headers)
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`404 — ${pathname} not found`)
  }
}

// --- start ------------------------------------------------------------------

const CERT = new URL('cert.pem', import.meta.url)
const KEY = new URL('key.pem', import.meta.url)
const https = existsSync(CERT) && existsSync(KEY)

const listen = (port) =>
  https
    ? createSecureServer({ cert: readFileSync(CERT), key: readFileSync(KEY) }, handle).listen(port)
    : createServer(handle).listen(port)

listen(PORT)
listen(ALT_PORT)

const scheme = https ? 'https' : 'http'
console.log(`browser-hardware demo → ${scheme}://localhost:${PORT}`)
console.log(`second origin        → ${scheme}://localhost:${ALT_PORT}  (only ever loaded in an iframe)`)

// Phone-only APIs — orientation, vibration, NFC — need a phone, and a phone needs
// a routable address. Print the LAN URLs, and be honest that they are not secure
// contexts without a certificate.
const lan = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address)

if (lan.length) {
  console.log(`\nfrom a phone on the same network:`)
  for (const address of lan) console.log(`  ${scheme}://${address}:${PORT}`)
  if (!https) console.log('  ⚠ plain http on a LAN address is NOT a secure context — see the README')
}
console.log()
