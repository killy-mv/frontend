import { randomUUID } from 'node:crypto'

// The one account in this demo. Password checking is deliberately trivial —
// this example is about custody (where the proof lives afterwards), not capture.
export const USERS = {
  'ada@example.com': { password: 'password', name: 'Ada Lovelace' },
}

export const APP_ORIGIN = 'http://localhost:5173'

export const opaque = () => randomUUID().replaceAll('-', '')

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function log(tag, ...rest) {
  console.log(`[${tag}]`, ...rest)
}

export function parseCookies(req) {
  const header = req.headers.cookie
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((pair) => {
      const eq = pair.indexOf('=')
      return [pair.slice(0, eq).trim(), decodeURIComponent(pair.slice(eq + 1))]
    }),
  )
}

export function readJson(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) }
    })
  })
}

export function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': 'application/json',
    // Protected responses must never sit in a shared or back-button cache.
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(JSON.stringify(body))
}

/**
 * Build a Set-Cookie value by hand so the flags are visible.
 * In production every one of these also gets `Secure` — omitted here only
 * because the demo runs on http://localhost.
 */
export function cookie(name, value, { httpOnly = true, path = '/', sameSite = 'Lax', maxAge } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`]
  if (httpOnly) parts.push('HttpOnly')
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`)
  return parts.join('; ')
}

export const expired = (name, opts) => cookie(name, '', { ...opts, maxAge: 0 })

/**
 * CORS for the cross-origin API. `Access-Control-Allow-Origin` must echo a real
 * origin (never `*`) once credentials are involved, or the browser drops the
 * response. Returns true if it handled a preflight and the caller should stop.
 */
export function cors(req, res) {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization')
    res.setHeader('Access-Control-Max-Age', '600')
    res.writeHead(204)
    res.end()
    return true
  }
  return false
}
