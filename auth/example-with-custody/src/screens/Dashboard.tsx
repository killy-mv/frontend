import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import type { Panel, User } from '../custody/types'

export function Dashboard({ user }: { user: User }) {
  const { custody, logout } = useAuth()
  const [panels, setPanels] = useState<Panel[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useBff, setUseBff] = useState(true)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    let cancelled = false

    // `cancelled` matters here: toggling the BFF switch twice quickly leaves two
    // requests in flight, and without this the slower one wins and the panel
    // shows the wrong source.
    custody
      .loadData({ useBff })
      .then((next) => {
        if (cancelled) return
        setPanels(next)
        setError(null)
      })
      .catch((cause: Error) => {
        if (cancelled) return
        setPanels(null)
        setError(cause.message)
      })

    return () => { cancelled = true }
  }, [custody, useBff, reloads])

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Signed in as {user.name}</h2>
        <button onClick={() => void logout()}>Log out</button>
      </header>

      {custody.id === 'hybrid' && (
        <label className="toggle">
          <input type="checkbox" checked={useBff} onChange={(e) => setUseBff(e.target.checked)} />
          Reach the partner API through your own server (BFF)
          <span className="muted">
            {useBff
              ? 'The browser holds one credential. The partner key never leaves your server.'
              : 'The browser now holds a second credential and can call the partner directly.'}
          </span>
        </label>
      )}

      {error && <p className="error">Could not load data: {error}</p>}

      <ul className="data">
        {(panels ?? []).map((panel) => (
          <li key={panel.label}>
            <strong>{panel.label}</strong>
            <span>{panel.value}</span>
            <span className="muted">{panel.from}</span>
          </li>
        ))}
      </ul>

      <button className="link" onClick={() => setReloads((n) => n + 1)}>Reload data</button>

      {custody.id !== 'same-site' && (
        <p className="muted">
          The partner access token expires after 60 seconds. Wait a minute, hit reload, and watch the
          refresh fire once and the request retry.
        </p>
      )}
    </section>
  )
}
