import { request } from '../api/request'
import { cookieSession } from './cookieSession'
import { describeToken, partnerFetch, partnerLogin, partnerLogout, setAccessToken } from './partnerToken'
import type { Custody, Panel } from './types'

// CASE 3 — both at once: your own same-site API *and* a third-party API.
//
// Identity comes from your API (cookie session). The question is what to do
// about the partner, and there are two answers with very different custody:
//
//   useBff = false → the browser also holds a partner access token in memory.
//                    Two credentials in one tab, two things to clear on logout,
//                    two things an injected script can reach.
//
//   useBff = true  → your server calls the partner with a key the browser never
//                    sees. The tab holds exactly one credential: the session
//                    cookie it cannot even read.
//
// The second is the one real apps converge on, and it is why "call the partner
// API straight from the frontend" is usually the wrong instinct.

type Stats = { calls: number; plan: string; seenBy: string }

export const hybrid: Custody = {
  id: 'hybrid',
  title: 'Hybrid',
  blurb: 'Cookie session for your API, plus a partner API — directly or through a BFF.',

  holds: () => `Session cookie (unreadable) for your API. ${describeToken()}`,

  restore: cookieSession.restore,

  async login(email, password) {
    // Your session first: it is the identity. The partner token is an extra
    // capability layered on top, not the thing that says who this person is.
    const user = await cookieSession.login(email, password)
    await partnerLogin(email, password).catch(() => {
      // The partner being down must not stop the user logging into your app.
    })
    return user
  },

  async logout() {
    // Two credentials means two revocations. Forgetting the second one is the
    // hybrid case's characteristic bug — the partner token stays valid until it
    // expires on its own.
    await Promise.allSettled([cookieSession.logout(), partnerLogout()])
    setAccessToken(null)
  },

  async loadData({ useBff }): Promise<Panel[]> {
    const notes = await cookieSession.loadData({ useBff })

    if (useBff) {
      // The browser sends only its session cookie. Your server attaches the
      // partner credential out of reach of any script on the page.
      const stats = await request<Stats>('/api/partner/stats', {
        credentials: 'same-origin',
        carried: 'sid cookie only — the partner key stays on your server',
      })
      return [...notes, { label: 'Partner calls', value: String(stats.calls), from: `via your API — ${stats.seenBy}` }]
    }

    const stats = await partnerFetch<Stats>('/stats')
    return [...notes, { label: 'Partner calls', value: String(stats.calls), from: `direct from browser — ${stats.seenBy}` }]
  },
}
