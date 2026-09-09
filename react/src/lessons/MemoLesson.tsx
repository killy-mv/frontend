import { memo, useCallback, useMemo, useState } from 'react'
import { useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Section, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 17 — Memoisation
   ========================================================================== */

export default function MemoLesson() {
  return (
    <>
      <Lede>
        Re-rendering is cheap. React calls a function and compares two trees of plain objects;
        it does not rebuild the DOM. So the honest summary of this lesson is: most{' '}
        <code>useMemo</code> in real codebases is noise, added defensively by people who never
        measured. Learn the three tools, then learn when they are actually warranted.
      </Lede>

      <Section title="The three tools">
        <Table
          head={['', 'Caches', 'Use when']}
          rows={[
            [<code key="1">memo(Component)</code>, 'A whole component render', 'A pure component re-renders often with identical props'],
            [<code key="2">useMemo(fn, deps)</code>, 'A computed value', 'The computation is genuinely expensive, or the result is a dependency'],
            [<code key="3">useCallback(fn, deps)</code>, 'A function identity', 'The function is a prop of a memo child, or an effect dependency'],
          ]}
        />

        <p>
          <code>useCallback(fn, deps)</code> is exactly <code>useMemo(() =&gt; fn, deps)</code>.
          There is nothing else to it.
        </p>
      </Section>

      <Section title="Why a component re-renders">
        <p>
          When a component renders, React re-renders all of its children — regardless of
          whether their props changed. That sounds wasteful and almost never is, because the
          work is a function call and an object comparison.
        </p>

        <Example region="children" column>
          <ParentChild />
        </Example>

        <p>
          <code>memo</code> tells React to skip a child whose props are shallow-equal to last
          time. Notice that it only helps if the props really are equal — which is where the
          other two hooks come in.
        </p>
      </Section>

      <Section title="Why memo so often does nothing">
        <p>
          Both children below are wrapped in <code>memo</code>. One still re-renders every
          time, because it is handed a fresh arrow function on every render of the parent and{' '}
          <code>() =&gt; {'{}'}</code> is never equal to another <code>() =&gt; {'{}'}</code>.
        </p>

        <Example region="callback" column>
          <CallbackDemo />
        </Example>

        <Note kind="warn">
          This is the trap: <code>memo</code> on the child does nothing unless{' '}
          <em>every</em> prop is stable. Objects, arrays, inline functions and JSX all break it.
          Adding <code>memo</code> without also stabilising the props costs a comparison and
          buys nothing.
        </Note>
      </Section>

      <Section title="useMemo for an expensive calculation">
        <p>
          The list below is filtered from ten thousand rows with a deliberately slow
          comparison. Without <code>useMemo</code> that runs on every keystroke in the unrelated
          box too. Type in each and watch the timing.
        </p>

        <Example region="expensive" column>
          <ExpensiveDemo />
        </Example>

        <p>
          "Expensive" means milliseconds you can measure, not "a loop". Filtering a hundred
          items takes microseconds; wrapping it in <code>useMemo</code> adds a dependency array
          to maintain and saves nothing.
        </p>
      </Section>

      <Section title="The other reason to memoise">
        <p>
          Sometimes the point is not speed but <em>identity</em>. If a value is a dependency of
          an effect, or a prop of a memoised child, or a context value, then a new object every
          render causes real work downstream — an effect that re-runs, a subtree that
          re-renders. Here <code>useMemo</code> is about correctness of behaviour, not
          performance.
        </p>

        <Code region="identity" />
      </Section>

      <Section title="When to reach for any of this">
        <ol>
          <li>
            <strong>Profile first.</strong> React DevTools has a Profiler that shows you which
            components rendered and how long they took. Guessing has a poor hit rate.
          </li>
          <li>
            <strong>Fix the structure before adding hooks.</strong> Moving state down to the
            component that actually uses it, or passing expensive subtrees as{' '}
            <code>children</code>, removes whole re-renders rather than making them cheaper.
          </li>
          <li>
            <strong>Then memoise, narrowly.</strong> A long list where each row does real work
            is the canonical justified case.
          </li>
        </ol>

        <Note>
          <strong>The React Compiler makes most of this obsolete.</strong> It inserts
          memoisation automatically at build time, correctly, without you maintaining
          dependency arrays. It is opt-in as of React 19 and not enabled in this project — but
          it is the reason not to spend much of your life hand-tuning{' '}
          <code>useCallback</code>.
        </Note>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region children
function PlainChild({ label }: { label: string }) {
  const renders = useRenderCount()
  return <Badge label={label} value={`${renders} renders`} />
}

const MemoChild = memo(function MemoChild({ label }: { label: string }) {
  const renders = useRenderCount()
  return <Badge label={label} value={`${renders} renders`} tone="hot" />
})

function ParentChild() {
  const [n, setN] = useState(0)

  return (
    <>
      <button onClick={() => setN(n + 1)}>re-render the parent ({n})</button>
      <PlainChild label="plain child" />
      {/* Same props every time, so memo skips it entirely. */}
      <MemoChild label="memo child" />
    </>
  )
}
// #endregion

// #region callback
const Button = memo(function Button({ onClick, label }: { onClick: () => void; label: string }) {
  const renders = useRenderCount()
  return (
    <button onClick={onClick}>
      {label} — {renders} renders
    </button>
  )
})

function CallbackDemo() {
  const [n, setN] = useState(0)
  const [clicks, setClicks] = useState(0)

  // A brand new function on every render. memo's shallow comparison sees a
  // different prop, so the child re-renders anyway.
  const unstable = () => setClicks((c) => c + 1)

  // The same function object every render, so memo can do its job.
  const stable = useCallback(() => setClicks((c) => c + 1), [])

  return (
    <>
      <button onClick={() => setN(n + 1)}>re-render the parent ({n})</button>
      <Button onClick={unstable} label="unstable prop" />
      <Button onClick={stable} label="useCallback prop" />
      <Badge label="clicks" value={clicks} />
    </>
  )
}
// #endregion

// #region expensive
const ROWS = Array.from({ length: 10000 }, (_, i) => `row ${i} — ${(i * 7919) % 9973}`)

function slowFilter(term: string) {
  const start = performance.now()
  const matches = ROWS.filter((r) => {
    // Deliberately wasteful, so the difference is visible rather than theoretical.
    let hit = false
    for (let i = 0; i < 60; i++) hit = r.includes(term)
    return hit
  })
  return { matches: matches.slice(0, 5), ms: Math.round(performance.now() - start) }
}

function ExpensiveDemo() {
  const [term, setTerm] = useState('42')
  const [unrelated, setUnrelated] = useState('')

  // Only re-runs when `term` changes. Typing in the other box is free.
  const memoised = useMemo(() => slowFilter(term), [term])

  return (
    <>
      <label>
        filter
        <input type="text" value={term} onChange={(e) => setTerm(e.target.value)} />
      </label>
      <label>
        unrelated state
        <input
          type="text"
          value={unrelated}
          onChange={(e) => setUnrelated(e.target.value)}
          placeholder="typing here does not re-filter"
        />
      </label>

      <Badge label="last filter took" value={`${memoised.ms}ms`} tone="hot" />
      <ul className="plain" style={{ width: '100%' }}>
        {memoised.matches.map((m) => (
          <li key={m}>{m}</li>
        ))}
        {memoised.matches.length === 0 && <li>no matches</li>}
      </ul>
    </>
  )
}
// #endregion

// #region identity
// Not about speed — about not re-running things downstream.
//
// ❌ a new object every render, so the effect fires on every render:
//
//   const options = { url, headers: { accept: 'application/json' } }
//   useEffect(() => { connect(options) }, [options])
//
// ✅ stable while its inputs are:
//
//   const options = useMemo(
//     () => ({ url, headers: { accept: 'application/json' } }),
//     [url],
//   )
//
// Same story for a context value, which every consumer below re-renders on:
//
//   const value = useMemo(() => ({ user, signOut }), [user, signOut])
//   return <AuthContext value={value}>{children}</AuthContext>
//
// And often the best fix is neither: move the object inside the effect, or
// depend on the primitive `url` instead of the object wrapping it.
// #endregion
