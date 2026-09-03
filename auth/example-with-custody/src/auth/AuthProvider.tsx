import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { currentMode } from '../custody'
import { AuthContext } from './context'
import type { AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const custody = useMemo(() => currentMode(), [])
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    // Boot. Until this resolves the app genuinely does not know who the user
    // is, and rendering the login screen during it is the flash the doc warns
    // about. A network failure is NOT the same as being logged out — one is
    // "try again", the other is "please sign in".
    custody
      .restore()
      .then((user) => {
        if (cancelled) return
        setState(user ? { status: 'authenticated', user } : { status: 'anonymous' })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: 'error', message: error.message })
      })

    return () => { cancelled = true }
  }, [custody])

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await custody.login(email, password)
      setState({ status: 'authenticated', user })
    },
    [custody],
  )

  const logout = useCallback(async () => {
    await custody.logout()
    // Clear local state only after the server has revoked. In a real app this
    // is also where the query cache gets wiped and other tabs get told.
    setState({ status: 'anonymous' })
  }, [custody])

  const value = useMemo(() => ({ state, custody, login, logout }), [state, custody, login, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}
