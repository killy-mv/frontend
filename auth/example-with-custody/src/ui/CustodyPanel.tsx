import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'

/**
 * The point of the whole example: what can a script running on this page get?
 * `document.cookie` is exactly what an injected script would see — the session
 * cookie is absent from it, and that absence is the security property.
 */
export function CustodyPanel() {
  const { custody, state } = useAuth()
  const [cookies, setCookies] = useState('')

  useEffect(() => {
    const read = () => setCookies(document.cookie)
    read()
    const timer = setInterval(read, 1000)
    return () => clearInterval(timer)
  }, [state])

  return (
    <section className="panel">
      <h2>What this tab holds</h2>
      <p>{custody.holds()}</p>

      <h3>document.cookie</h3>
      <pre className={cookies ? '' : 'muted'}>{cookies || '(empty — nothing readable from JS)'}</pre>
      <p className="muted">
        This is everything an injected script could read. Compare it with
        DevTools → Application → Cookies, which shows the HttpOnly ones too.
      </p>
    </section>
  )
}
