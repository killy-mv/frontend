import { useState } from 'react'
import { useLog, useRenderCount } from '../lib/hooks'
import { Badge, Example, Lede, Note, Out, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 6 — State as a snapshot
   ========================================================================== */

export default function SnapshotLesson() {
  return (
    <>
      <Lede>
        Every render gets its own frozen copy of state. The variable you read in a handler
        is not a live view of anything — it is the value from the render that created that
        handler. Almost every confusing React bug is a variation on that one sentence.
      </Lede>

      <Section title="Setting state three times adds one">
        <p>
          The left button calls <code>setCount(count + 1)</code> three times. It does not add
          three. During this render <code>count</code> is <code>0</code>, so all three calls
          say the same thing: "make it 1".
        </p>

        <Example region="plus-three" column>
          <PlusThree />
        </Example>

        <Snippet
          code={`// count is 0 for the whole of this render.
setCount(count + 1)   // queue: set to 1
setCount(count + 1)   // queue: set to 1   (count is still 0 here)
setCount(count + 1)   // queue: set to 1

// The updater form is handed the pending value instead:
setCount(c => c + 1)  // queue: 0 -> 1
setCount(c => c + 1)  // queue: 1 -> 2
setCount(c => c + 1)  // queue: 2 -> 3`}
        />

        <Note>
          <strong>The rule:</strong> if the next value depends on the current one, pass a
          function. <code>setThing(t =&gt; …)</code> is never wrong; <code>setThing(thing + 1)</code>{' '}
          is only right when nothing else has queued an update first.
        </Note>
      </Section>

      <Section title="Reading state right after setting it">
        <p>
          The value logged below is the one from <em>this</em> render, not the one you just
          queued. There is no version of this that works — the variable is a <code>const</code>{' '}
          in a closure that has already been created.
        </p>

        <Example region="read-after" column>
          <ReadAfterSet />
        </Example>
      </Section>

      <Section title="Batching: many updates, one render">
        <p>
          React does not re-render after each setter call. It finishes the event handler,
          collects everything that was queued, and renders once. Three updates below, one
          render — watch the render badge.
        </p>

        <Example region="batching" column>
          <Batching />
        </Example>

        <p>
          Since React 18 this holds inside promises, timeouts and native event handlers too,
          not just React events. That is why <code>setLoading(false)</code> and{' '}
          <code>setData(json)</code> after an <code>await</code> produce one render rather than
          two — no intermediate state where the spinner is gone but the data is not there yet.
        </p>
      </Section>

      <Section title="The stale closure">
        <p>
          A timeout captures the render it was created in and keeps it, however long it waits.
          Press "delayed +1", then press the plain "+1" a few times before it fires.
        </p>

        <Example region="stale" column>
          <StaleClosure />
        </Example>

        <p>
          The naive version rewinds your other clicks, because it was told to compute{' '}
          <code>count + 1</code> from a <code>count</code> that is now three renders old. The
          updater version asks React for the latest value at the moment it runs, so it adds one
          to whatever is current.
        </p>

        <Note kind="warn">
          The same trap appears in every callback that outlives its render: event listeners
          added in an effect, <code>setInterval</code>, request callbacks, subscriptions. Reach
          for the updater form, or list the value in the effect's dependency array so the
          callback is recreated when it changes.
        </Note>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region plus-three
function PlusThree() {
  const [naive, setNaive] = useState(0)
  const [updater, setUpdater] = useState(0)

  return (
    <>
      <button
        onClick={() => {
          setNaive(naive + 1)
          setNaive(naive + 1)
          setNaive(naive + 1)
        }}
      >
        setNaive(naive + 1) ×3
      </button>
      <Badge label="naive" value={naive} />

      <button
        onClick={() => {
          setUpdater((n) => n + 1)
          setUpdater((n) => n + 1)
          setUpdater((n) => n + 1)
        }}
      >
        setUpdater(n =&gt; n + 1) ×3
      </button>
      <Badge label="updater" value={updater} tone="hot" />
    </>
  )
}
// #endregion

// #region read-after
function ReadAfterSet() {
  const [count, setCount] = useState(0)
  const { lines, log } = useLog()

  function handleClick() {
    log('before setCount, count is', count)
    setCount(count + 1)
    // Still the old value. `count` is a const captured by this closure; the
    // new value only exists in the *next* render.
    log('after  setCount, count is', count, '← unchanged')
  }

  return (
    <>
      <button onClick={handleClick}>increment and log</button>
      <Badge label="count (this render)" value={count} tone="hot" />
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region batching
function Batching() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [c, setC] = useState(0)
  const renders = useRenderCount()

  return (
    <>
      <button
        onClick={() => {
          // Three separate state cells, three setter calls, ONE render.
          setA((n) => n + 1)
          setB((n) => n + 2)
          setC((n) => n + 3)
        }}
      >
        update three states at once
      </button>
      <Badge label="a" value={a} />
      <Badge label="b" value={b} />
      <Badge label="c" value={c} />
      <Badge label="renders" value={renders} tone="hot" />
    </>
  )
}
// #endregion

// #region stale
function StaleClosure() {
  const [count, setCount] = useState(0)
  const [pending, setPending] = useState(0)

  function delayedNaive() {
    setPending((p) => p + 1)
    setTimeout(() => {
      // `count` was captured when this handler was created, two seconds ago.
      setCount(count + 1)
      setPending((p) => p - 1)
    }, 2000)
  }

  function delayedUpdater() {
    setPending((p) => p + 1)
    setTimeout(() => {
      // React hands the updater the value that is current when it runs.
      setCount((n) => n + 1)
      setPending((p) => p - 1)
    }, 2000)
  }

  return (
    <>
      <button onClick={() => setCount(count + 1)}>+1 now</button>
      <button onClick={delayedNaive}>delayed +1 (stale)</button>
      <button onClick={delayedUpdater}>delayed +1 (updater)</button>
      <Badge label="count" value={count} tone="hot" />
      <Badge label="timers pending" value={pending} />
    </>
  )
}
// #endregion
