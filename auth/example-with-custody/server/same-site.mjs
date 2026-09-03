import { createServer } from 'node:http'
import { PARTNER_PORT, PARTNER_SERVICE_KEY } from './third-party.mjs'
import { USERS, cookie, expired, log, opaque, parseCookies, readJson, send, wait } from './lib.mjs'

export const PORT = 8787

// Server-side session table. The browser only ever holds the opaque `sid`.
const sessions = new Map() // sid -> { email, csrf }

const notes = [
  { id: 1, title: 'Custody is about blast radius', body: 'Not about being clever.' },
  { id: 2, title: 'The safest thing to hold', body: 'Is nothing at all.' },
]

function currentSession(req) {
  const sid = parseCookies(req).sid
  return sid ? sessions.get(sid) : undefined
}

function unauthorized(res) {
  send(res, 401, { error: 'no_session' })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname.replace(/^\/api/, '')
  const method = req.method

  // Latency on purpose: without it the `loading` state is invisible and you
  // never see why it has to exist.
  await wait(400)

  if (method === 'POST' && path === '/auth/login') {
    const { email, password } = await readJson(req)
    const user = USERS[email]
    if (!user || user.password !== password) {
      return send(res, 401, { error: 'bad_credentials' })
    }

    const sid = opaque()
    const csrf = opaque()
    sessions.set(sid, { email, csrf })
    log('same-site', `login ok, session ${sid.slice(0, 8)}…`)

    return send(res, 200, { user: { name: user.name, email } }, {
      'set-cookie': [
        // HttpOnly: document.cookie cannot see this. That is the whole point.
        cookie('sid', sid, { httpOnly: true }),
        // Readable on purpose — the double-submit CSRF token. It is not a
        // credential, it only proves the request came from our own page.
        cookie('csrf', csrf, { httpOnly: false }),
      ],
    })
  }

  if (method === 'GET' && path === '/auth/me') {
    const session = currentSession(req)
    if (!session) return unauthorized(res)
    const user = USERS[session.email]
    return send(res, 200, { user: { name: user.name, email: session.email } })
  }

  if (method === 'POST' && path === '/auth/logout') {
    const sid = parseCookies(req).sid
    // Revoke server-side. Clearing the cookie alone would leave a valid
    // session sitting in this map for anyone who copied it.
    if (sid) sessions.delete(sid)
    log('same-site', 'logout, session revoked')
    return send(res, 200, { ok: true }, {
      'set-cookie': [expired('sid'), expired('csrf', { httpOnly: false })],
    })
  }

  if (method === 'GET' && path === '/notes') {
    const session = currentSession(req)
    if (!session) return unauthorized(res)
    return send(res, 200, { notes })
  }

  if (method === 'POST' && path === '/notes') {
    const session = currentSession(req)
    if (!session) return unauthorized(res)
    // Cookies ride along automatically from anywhere, including a form on
    // someone else's site — so state-changing requests need a second proof
    // that the caller could actually read our page.
    if (req.headers['x-csrf-token'] !== session.csrf) {
      log('same-site', 'rejected: csrf token missing or wrong')
      return send(res, 403, { error: 'csrf_failed' })
    }
    const { title } = await readJson(req)
    notes.push({ id: notes.length + 1, title: title || 'Untitled', body: 'Added from the demo.' })
    return send(res, 201, { notes })
  }

  // The BFF route: our server holds the partner credential and the browser
  // never sees it. Compare with the browser calling the partner directly.
  if (method === 'GET' && path === '/partner/stats') {
    const session = currentSession(req)
    if (!session) return unauthorized(res)
    const upstream = await fetch(`http://localhost:${PARTNER_PORT}/stats`, {
      headers: { 'x-partner-key': PARTNER_SERVICE_KEY },
    })
    const data = await upstream.json()
    log('same-site', 'proxied /stats to partner with the service key')
    return send(res, upstream.status, data)
  }

  send(res, 404, { error: 'not_found' })
})

export function start() {
  server.listen(PORT, () => log('same-site', `your API on http://localhost:${PORT} (proxied as /api)`))
}
