import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { MODES, switchMode } from './custody'
import { Dashboard } from './screens/Dashboard'
import { Login } from './screens/Login'
import { CustodyPanel } from './ui/CustodyPanel'
import { RequestLog } from './ui/RequestLog'

function Screen() {
  const { state } = useAuth()

  // Order is the priority, same as example-with-states. `loading` first, so the
  // login form never flashes while the boot request is still in the air.
  if (state.status === 'loading') {
    return (
      <section className="panel">
        <h2>Checking your session…</h2>
        <p className="muted">
          Nothing readable locally tells us who you are, so we have to ask the server. This is why
          `loading` exists.
        </p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="panel">
        <h2>Could not reach the server</h2>
        <p className="error">{state.message}</p>
        <p className="muted">
          Deliberately not the login screen: a network failure is not the same as being logged out.
          Start the API with <code>npm run api</code>.
        </p>
      </section>
    )
  }

  if (state.status === 'authenticated') return <Dashboard user={state.user} />

  return <Login />
}

function ModeTabs() {
  const { custody } = useAuth()

  return (
    <nav className="tabs">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className={mode.id === custody.id ? 'tab active' : 'tab'}
          onClick={() => switchMode(mode.id)}
        >
          {mode.title}
        </button>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <main>
        <h1>Custody — where the proof lives</h1>
        <p className="muted">
          The same app three times over. Only one thing changes: what the browser holds between
          requests. Log in with <code>ada@example.com</code> / <code>password</code>.
        </p>

        <ModeTabs />
        <Screen />

        <div className="split">
          <CustodyPanel />
          <RequestLog />
        </div>
      </main>
    </AuthProvider>
  )
}
