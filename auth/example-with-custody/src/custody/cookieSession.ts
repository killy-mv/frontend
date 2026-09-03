import { ApiError, json, request } from '../api/request'
import type { Custody, Panel, User } from './types'

// CASE 1 — same-site API, cookie session.
//
// Custody code in this file: none. There is no token, no storage, no
// interceptor. The browser holds an HttpOnly cookie that this app cannot read,
// cannot leak, and cannot forget to attach. That is the entire feature.

const CARRIED = 'sid cookie (HttpOnly, automatic)'

// Same-origin requests send cookies by default, so this line is redundant —
// it is here to name the thing that would change cross-origin, where you would
// need `credentials: 'include'` plus CORS on the server.
const withCookies: RequestInit = { credentials: 'same-origin' }

/** The CSRF cookie is deliberately readable: it is a proof of origin, not a credential. */
function csrfToken() {
  return document.cookie
    .split('; ')
    .find((pair) => pair.startsWith('csrf='))
    ?.split('=')[1]
}

export const cookieSession: Custody = {
  id: 'same-site',
  title: 'Same-site API',
  blurb: 'Session cookie. The app stores nothing and can read nothing.',

  holds: () =>
    'Nothing this app can reach. The session cookie is HttpOnly, so document.cookie cannot see it.',

  async restore() {
    // Nothing readable locally, so boot has to ask. This request is the reason
    // the `loading` state exists at all.
    try {
      const { user } = await request<{ user: User }>('/api/auth/me', { ...withCookies, carried: CARRIED })
      return user
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },

  async login(email, password) {
    const { user } = await request<{ user: User }>('/api/auth/login', {
      ...withCookies,
      ...json({ email, password }),
      carried: 'nothing yet — this request creates the session',
    })
    return user
  },

  async logout() {
    // Revoke on the server. Deleting the cookie locally would leave the session
    // alive in the server's table.
    const post = json({})
    await request('/api/auth/logout', {
      ...withCookies,
      ...post,
      headers: { ...post.headers, 'x-csrf-token': csrfToken() ?? '' },
      carried: CARRIED,
    })
  },

  async loadData(): Promise<Panel[]> {
    const { notes } = await request<{ notes: { title: string }[] }>('/api/notes', { ...withCookies, carried: CARRIED })
    return notes.map((note, index) => ({
      label: `Note ${index + 1}`,
      value: note.title,
      from: 'your API — cookie',
    }))
  },
}
