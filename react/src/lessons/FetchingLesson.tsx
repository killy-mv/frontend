import { useEffect, useState } from 'react'
import { useLog } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 18 — Data fetching
   ========================================================================== */

export default function FetchingLesson() {
  return (
    <>
      <Lede>
        Fetching is a side effect, so it lives in an effect. The request itself is the easy
        part — <code>../fetch</code> covers that. What React adds is three states to render
        instead of one, and a cleanup problem: by the time a response arrives, the component
        may have moved on, or been unmounted entirely.
      </Lede>

      <Section title="A fake API, so this page works offline">
        <p>
          Every demo below calls a local function that waits a random 300–1500ms and then
          resolves. That is deliberate: the race condition further down only shows up when
          responses come back out of order, and a real network is too polite to demonstrate it
          on demand.
        </p>

        <Code region="api" label="src/lessons/FetchingLesson.tsx" />
      </Section>

      <Section title="Three states, not one">
        <p>
          Any component that loads something has to render at least three things: waiting,
          failed, and loaded. Forgetting the middle one is how you get an app that silently
          shows nothing when the server is down.
        </p>

        <Example region="basic" column>
          <BasicFetch />
        </Example>

        <Note>
          Keep them in as few pieces of state as you can. Separate{' '}
          <code>isLoading</code>, <code>error</code> and <code>data</code> variables can
          contradict each other, and one day they will. Here <code>loading</code> is not
          stored at all — it is "the newest result is older than the newest request", worked
          out during render. Nothing to keep in sync, and no <code>setState</code> at the top
          of the effect.
        </Note>
      </Section>

      <Section title="The race condition">
        <p>
          Click through the users quickly. The unguarded version can end up showing a profile
          you did not ask for: request A is slow, request B is fast, B lands first, then A
          arrives and overwrites it.
        </p>

        <Example region="race" column>
          <RaceDemo />
        </Example>

        <Snippet
          code={`useEffect(() => {
  let ignore = false            // scoped to THIS run of the effect

  loadUser(id).then(data => {
    if (!ignore) setUser(data)  // a stale response just does nothing
  })

  return () => { ignore = true } // cleanup flips the flag for the old run
}, [id])`}
        />

        <p>
          The cleanup runs before the next effect, so the previous request's{' '}
          <code>ignore</code> is <code>true</code> by the time it resolves. Four lines, and the
          bug is structurally impossible rather than merely unlikely.
        </p>

        <Note>
          <code>AbortController</code> does the same job one level down: it cancels the request
          instead of ignoring the answer, freeing the connection. Use both — abort to save the
          work, the flag to protect the state.
        </Note>
      </Section>

      <Section title="Fetching in an effect is the floor, not the ceiling">
        <p>
          Everything above is correct and still misses things a real app needs: caching between
          components, deduplicating identical requests, refetching when the window regains
          focus, retries, pagination, and not showing a spinner for a value you already have.
        </p>
        <p>That is why data fetching is the one area where a library genuinely pays for itself:</p>
        <ul>
          <li>
            <strong>TanStack Query</strong> or <strong>SWR</strong> — a cache and a fetch
            lifecycle, still just hooks.
          </li>
          <li>
            <strong>A framework loader</strong> — React Router or Next.js fetch before
            rendering, which removes the waterfall where a component has to mount before its
            request can start.
          </li>
          <li>
            <strong>Server Components</strong> — the data never reaches the browser as a
            request at all. See <code>../next-js</code>.
          </li>
        </ul>

        <Code region="use" label="React 19: use() and Suspense" />
      </Section>
    </>
  )
}

/* ---------- a stand-in for the network ------------------------------------- */

// #region api
type User = { id: number; name: string; role: string }

const USERS: User[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Analyst of the Analytical Engine' },
  { id: 2, name: 'Grace Hopper', role: 'Compiler pioneer' },
  { id: 3, name: 'Alan Turing', role: 'Broke Enigma, invented the Turing machine' },
]

/** Resolves after a random delay, so responses arrive out of order. */
function loadUser(id: number, { fail = false } = {}): Promise<User> {
  const delay = 300 + Math.random() * 1200

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error('500 Internal Server Error'))
      else resolve(USERS.find((u) => u.id === id)!)
    }, delay)
  })
}
// #endregion

/* ---------- demos ---------------------------------------------------------- */

// #region basic
type Request = { n: number; fail: boolean }
type Result = { n: number; user?: User; error?: string }

function BasicFetch() {
  const [request, setRequest] = useState<Request>({ n: 1, fail: false })
  const [result, setResult] = useState<Result | null>(null)

  // Derived, not stored. "Loading" simply means the newest result on hand is
  // older than the newest request — so it can never get out of step, and the
  // effect never has to set state just to announce that it started.
  const loading = result?.n !== request.n

  useEffect(() => {
    let ignore = false

    loadUser(1, { fail: request.fail })
      .then((user) => {
        if (!ignore) setResult({ n: request.n, user })
      })
      .catch((err: Error) => {
        if (!ignore) setResult({ n: request.n, error: err.message })
      })

    return () => {
      ignore = true
    }
  }, [request])

  return (
    <>
      <button onClick={() => setRequest((r) => ({ ...r, n: r.n + 1 }))}>reload</button>
      <label>
        <input
          type="checkbox"
          checked={request.fail}
          onChange={(e) => setRequest((r) => ({ n: r.n + 1, fail: e.target.checked }))}
        />
        make it fail
      </label>

      {/* One branch per state. Handle all three and there are no blank screens. */}
      {loading && <Badge label="status" value="loading…" />}
      {!loading && result?.error && <Badge label="failed" value={result.error} />}
      {!loading && result?.user && (
        <Badge label={result.user.name} value={result.user.role} tone="hot" />
      )}
    </>
  )
}
// #endregion

// #region race
function RaceDemo() {
  const [id, setId] = useState(1)
  const [guarded, setGuarded] = useState(true)
  const [shown, setShown] = useState<User | null>(null)
  const { lines, log, clear } = useLog()

  useEffect(() => {
    let ignore = false
    const started = Date.now()

    loadUser(id).then((data) => {
      const took = Date.now() - started
      if (guarded && ignore) {
        log(`response for #${id} ignored after ${took}ms — component moved on`)
        return
      }
      log(`showing #${data.id} ${data.name} (took ${took}ms)`)
      setShown(data)
    })

    return () => {
      // Without this line, a slow earlier request can land last and win.
      ignore = true
    }
  }, [id, guarded, log])

  return (
    <>
      {USERS.map((u) => (
        <button key={u.id} onClick={() => setId(u.id)} disabled={id === u.id}>
          load #{u.id}
        </button>
      ))}
      <label>
        <input type="checkbox" checked={guarded} onChange={(e) => setGuarded(e.target.checked)} />
        ignore stale responses
      </label>
      <button onClick={clear}>clear log</button>

      <Badge label="asked for" value={`#${id}`} />
      <Badge label="on screen" value={shown ? `#${shown.id} ${shown.name}` : '—'} tone="hot" />
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region use
// React 19 can read a promise directly during render, and Suspense renders the
// fallback until it resolves:
//
//   function Profile({ userPromise }) {
//     const user = use(userPromise)     // suspends until it settles
//     return <h1>{user.name}</h1>
//   }
//
//   <Suspense fallback={<Spinner />}>
//     <Profile userPromise={loadUser(1)} />
//   </Suspense>
//
//   // errors go to the nearest error boundary, not a catch block
//
// The loading branch and the error branch move out of the component entirely.
// The catch: the promise must be created by a framework or a cache, not inside
// the component — a promise made during render is a new promise every render,
// which suspends forever.
// #endregion
