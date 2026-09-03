export type User = { name: string; email: string }

export type Panel = { label: string; value: string; from: string }

export type ModeId = 'same-site' | 'third-party' | 'hybrid'

/**
 * The three modes differ *only* in custody — where the proof lives between
 * requests — so they implement the same four operations and the rest of the app
 * never learns which one is running.
 */
export type Custody = {
  id: ModeId
  title: string
  blurb: string
  /** What is sitting in the browser right now, for the "what do we hold" panel. */
  holds: () => string
  /** Boot: ask the server who we are. In-memory custody has nothing to read locally. */
  restore: () => Promise<User | null>
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  loadData: (options: { useBff: boolean }) => Promise<Panel[]>
}
