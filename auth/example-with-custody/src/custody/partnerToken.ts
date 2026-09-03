import { ApiError, json, request } from '../api/request'
import type { User } from './types'

export const PARTNER = 'http://localhost:8788'

// ─────────────────────────────────────────────────────────────────────────────
// The token store.
//
// A module-scoped variable, deliberately NOT React state. A token in the
// component tree shows up in React DevTools, in any state snapshot an error
// reporter serialises, and — the classic accident — in localStorage the moment
// someone adds a persistence middleware. Here it lives in a closure, dies on
// reload, and nothing can enumerate it.
// ─────────────────────────────────────────────────────────────────────────────
let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => { accessToken = token }

export function describeToken() {
  if (!accessToken) return 'No token in memory.'
  return `Access token in memory: ${accessToken.slice(0, 8)}… (gone on reload, invisible to document.cookie)`
}

const authHeader = (): Record<string, string> =>
  accessToken ? { authorization: `Bearer ${accessToken}` } : {}

type TokenResponse = { accessToken: string; user: User }

export async function partnerLogin(email: string, password: string) {
  const { accessToken: token, user } = await request<TokenResponse>(`${PARTNER}/oauth/token`, {
    ...json({ email, password }),
    // Cross-origin, so cookies need opting in explicitly — this is what lets the
    // partner set its HttpOnly refresh cookie.
    credentials: 'include',
    carried: 'nothing yet — this request mints the token',
  })
  setAccessToken(token)
  return user
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-flight refresh.
//
// The refresh token rotates server-side, so if three requests 401 at once and
// each starts its own refresh, two of them arrive holding a token that no
// longer exists and the user gets logged out mid-session. Storing the promise
// means everyone waits on the same call.
// ─────────────────────────────────────────────────────────────────────────────
let refreshing: Promise<User | null> | null = null

export function refreshPartnerSession() {
  refreshing ??= runRefresh().finally(() => { refreshing = null })
  return refreshing
}

async function runRefresh(): Promise<User | null> {
  try {
    const { accessToken: token, user } = await request<TokenResponse>(`${PARTNER}/oauth/refresh`, {
      ...json({}),
      credentials: 'include',
      carried: 'partner_refresh cookie (HttpOnly, scoped to /oauth)',
    })
    setAccessToken(token)
    return user
  } catch (error) {
    setAccessToken(null)
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/** Call the partner API, refreshing once if the token has expired. */
export async function partnerFetch<T>(path: string): Promise<T> {
  try {
    return await request<T>(`${PARTNER}${path}`, {
      headers: authHeader(),
      carried: 'Authorization: Bearer (from memory)',
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error

    const user = await refreshPartnerSession()
    if (!user) throw error

    // Retry exactly once. A second failure means the session is genuinely gone.
    return request<T>(`${PARTNER}${path}`, {
      headers: authHeader(),
      carried: 'Authorization: Bearer (refreshed, retried once)',
    })
  }
}

export async function partnerLogout() {
  const post = json({})
  await request(`${PARTNER}/oauth/revoke`, {
    ...post,
    credentials: 'include',
    headers: { ...post.headers, ...authHeader() },
    carried: 'bearer + refresh cookie',
  }).catch(() => {})
  setAccessToken(null)
}
