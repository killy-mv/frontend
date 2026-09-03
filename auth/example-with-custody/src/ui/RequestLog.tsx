import { useSyncExternalStore } from 'react'
import { clearLog, snapshot, subscribe } from '../api/log'

export function RequestLog() {
  const entries = useSyncExternalStore(subscribe, snapshot)

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Requests</h2>
        {entries.length > 0 && <button className="link" onClick={clearLog}>clear</button>}
      </header>

      {entries.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="log">
          {entries.map((entry) => (
            <li key={entry.id}>
              <code className={typeof entry.status === 'number' && entry.status < 400 ? 'ok' : 'bad'}>
                {entry.status}
              </code>
              <span className="method">{entry.method}</span>
              <span className="url">{entry.url.replace('http://localhost:8788', 'partner')}</span>
              <span className="carried">carried: {entry.carried}</span>
              <span className="muted">{entry.ms}ms</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
