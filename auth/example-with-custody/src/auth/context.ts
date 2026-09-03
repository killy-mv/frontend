import { createContext } from 'react'
import type { Custody, User } from '../custody/types'

// The same state machine as example-with-states, now driven by a real server
// instead of buttons: loading | authenticated | anonymous, plus an error state
// that is deliberately kept separate from "anonymous".
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' }
  | { status: 'error'; message: string }

export type AuthValue = {
  state: AuthState
  custody: Custody
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
