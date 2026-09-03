import {
  describeToken,
  partnerFetch,
  partnerLogin,
  partnerLogout,
  refreshPartnerSession,
} from './partnerToken'
import type { Custody, Panel } from './types'

// CASE 2 — cross-origin API you do not control, bearer token.
//
// No cookie session of your own here: the partner API is the only source of
// identity, so the access token IS the session. It lives in memory, which means
// a reload wipes it and boot has to re-mint one from the refresh cookie.

export const memoryToken: Custody = {
  id: 'third-party',
  title: 'Third-party API',
  blurb: 'Access token in memory, refresh token in an HttpOnly cookie.',

  holds: describeToken,

  // The token died with the last page. Nothing local to read, so ask the
  // refresh endpoint — the HttpOnly cookie is the only thing that survived.
  restore: refreshPartnerSession,

  login: partnerLogin,

  logout: partnerLogout,

  async loadData(): Promise<Panel[]> {
    const stats = await partnerFetch<{ calls: number; plan: string; seenBy: string }>('/stats')
    return [
      { label: 'API calls', value: String(stats.calls), from: `partner — ${stats.seenBy}` },
      { label: 'Plan', value: stats.plan, from: `partner — ${stats.seenBy}` },
    ]
  },
}
