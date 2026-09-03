import { createServer } from 'node:http'
import { USERS, cookie, cors, expired, log, opaque, parseCookies, readJson, send, wait } from './lib.mjs'

export const PARTNER_PORT = 8788

// A server-to-server credential. It lives in this demo's "your API" process and
// must never be shipped to a browser — the name is a reminder.
export const PARTNER_SERVICE_KEY = 'sk_partner_never_send_to_the_browser'

// Short on purpose, so you can watch a token expire and see the refresh fire.
const ACCESS_TTL_MS = 60_000

const accessTokens = new Map() // token -> { email, expiresAt }
const refreshTokens = new Map() // token -> email

function issueAccess(email) {
  const token = opaque()
  accessTokens.set(token, { email, expiresAt: Date.now() + ACCESS_TTL_MS })
  return { accessToken: token, expiresIn: ACCESS_TTL_MS / 1000 }
}

function bearer(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return undefined
  const record = accessTokens.get(header.slice(7))
  if (!record) return undefined
  if (record.expiresAt < Date.now()) {
    accessTokens.delete(header.slice(7))
    return undefined
  }
  return record
}

const server = createServer(async (req, res) => {
  if (cors(req, res)) return

  const url = new URL(req.url, `http://localhost:${PARTNER_PORT}`)
  const method = req.method
  await wait(400)

  if (method === 'POST' && url.pathname === '/oauth/token') {
    const { email, password } = await readJson(req)
    const user = USERS[email]
    if (!user || user.password !== password) {
      return send(res, 401, { error: 'bad_credentials' })
    }

    const refresh = opaque()
    refreshTokens.set(refresh, email)
    log('partner', 'issued access token + refresh cookie')

    return send(res, 200, { ...issueAccess(email), user: { name: user.name, email } }, {
      // The access token goes in the body — the app holds it in memory.
      // The refresh token goes in an HttpOnly cookie scoped to /oauth, so JS
      // can never read it and it is only sent to the endpoints that need it.
      'set-cookie': [cookie('partner_refresh', refresh, { path: '/oauth' })],
    })
  }

  if (method === 'POST' && url.pathname === '/oauth/refresh') {
    const presented = parseCookies(req).partner_refresh
    const email = presented && refreshTokens.get(presented)
    if (!email) return send(res, 401, { error: 'no_refresh_token' })

    // Rotation: the old refresh token dies here. This is why a naive
    // interceptor that fires five refreshes at once logs the user out —
    // four of them arrive holding a token that no longer exists.
    refreshTokens.delete(presented)
    const rotated = opaque()
    refreshTokens.set(rotated, email)
    log('partner', 'refreshed, rotated the refresh token')

    const user = USERS[email]
    return send(res, 200, { ...issueAccess(email), user: { name: user.name, email } }, {
      'set-cookie': [cookie('partner_refresh', rotated, { path: '/oauth' })],
    })
  }

  if (method === 'POST' && url.pathname === '/oauth/revoke') {
    const presented = parseCookies(req).partner_refresh
    if (presented) refreshTokens.delete(presented)
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) accessTokens.delete(header.slice(7))
    log('partner', 'revoked')
    return send(res, 200, { ok: true }, {
      'set-cookie': [expired('partner_refresh', { path: '/oauth' })],
    })
  }

  if (method === 'GET' && url.pathname === '/stats') {
    // Two accepted credentials: a user's bearer token from the browser, or the
    // service key from a trusted server. Note it does NOT accept a cookie —
    // a real third-party API has no session with your user.
    if (req.headers['x-partner-key'] === PARTNER_SERVICE_KEY) {
      return send(res, 200, { calls: 1284, plan: 'pro', seenBy: 'service key (server-to-server)' })
    }
    const session = bearer(req)
    if (!session) return send(res, 401, { error: 'invalid_token' })
    return send(res, 200, { calls: 1284, plan: 'pro', seenBy: `bearer token for ${session.email}` })
  }

  send(res, 404, { error: 'not_found' })
})

export function start() {
  server.listen(PARTNER_PORT, () => log('partner', `partner API on http://localhost:${PARTNER_PORT} (cross-origin)`))
}
