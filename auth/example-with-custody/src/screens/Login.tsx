import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export function Login() {
  const { login, custody } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    // Read the password straight off the form and let it go out of scope. It is
    // never held in React state, so it cannot end up in DevTools, a state
    // snapshot, or an error report.
    const data = new FormData(event.currentTarget)

    try {
      await login(String(data.get('email')), String(data.get('password')))
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'bad_credentials'
        ? 'Wrong email or password.'
        : 'Could not reach the server.')
      setPending(false)
    }
  }

  return (
    <section className="panel">
      <h2>Sign in</h2>
      <p className="muted">{custody.blurb}</p>

      <form onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" defaultValue="ada@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" defaultValue="password" required />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="muted">
        This form is in your own DOM, so it is the capture problem, not the custody one —
        any script on this page can read it. See auth.md.
      </p>
    </section>
  )
}
