/* eslint-disable react-hooks/refs, react-hooks/exhaustive-deps --
   DependencyTrap at the bottom of this file depends on an object that is rebuilt
   every render, and counts effect runs in refs it reads during render. Both are
   flagged, both are the demonstration. */

import { useEffect, useRef, useState } from 'react'
import { useLog, useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 12 — Effects
   ========================================================================== */

export default function EffectsLesson() {
  return (
    <>
      <Lede>
        Rendering must be pure: work out what the UI should look like, touch nothing else.
        Effects are the sanctioned exit from that rule — code that runs <em>after</em> React
        has updated the DOM, for synchronising your component with something that is not
        React. A subscription, a timer, the document title, a chart library that wants a real
        node.
      </Lede>

      <Section title="The shape">
        <Snippet
          code={`useEffect(() => {
  // 1. the effect: runs after every render that passed the dependency check
  const id = setInterval(tick, 1000)

  return () => {
    // 2. the cleanup: runs before the next effect, and on unmount
    clearInterval(id)
  }
}, [tick])  // 3. the dependencies`}
        />

        <Table
          head={['Second argument', 'Runs']}
          rows={[
            [<em key="1">omitted</em>, 'After every single render. Almost always a mistake.'],
            [<code key="2">[]</code>, 'Once after mount, cleanup once on unmount.'],
            [<code key="3">[a, b]</code>, 'On mount, and after any render where a or b changed.'],
          ]}
        />

        <Note kind="warn">
          The dependency array is not a "when to run" switch you get to choose — it is a
          promise that the effect uses nothing else from the component. Leave something out
          and the effect keeps reading a stale copy of it forever. Let the{' '}
          <code>react-hooks/exhaustive-deps</code> lint rule fill it in; when it complains,
          the fix is nearly always to restructure the effect, not to silence the rule.
        </Note>
      </Section>

      <Section title="Synchronising with something outside React">
        <p>
          The document title is not React's. Neither is a <code>setInterval</code>, nor the
          window's resize event. Each of these demos owns a piece of the outside world and
          gives it back when it is done.
        </p>

        <Example region="title" column>
          <TitleSync />
        </Example>

        <Example region="clock" column>
          <Clock />
        </Example>

        <Example region="listener" column>
          <WindowSize />
        </Example>
      </Section>

      <Section title="Cleanup is not optional">
        <p>
          Mount and unmount the subscriber below a few times, then read the log. Every setup
          has a matching teardown. Comment out the <code>return</code> and you have a
          component that leaks a listener every time it appears — a class of bug that only
          shows up after a user has been on the page for an hour.
        </p>

        <Example region="cleanup" column>
          <CleanupDemo />
        </Example>

        <p>Cleanup runs in three situations, and it is worth knowing all three:</p>
        <ul>
          <li>Before the effect runs again, because a dependency changed.</li>
          <li>When the component unmounts.</li>
          <li>
            Immediately after mount in development, because <code>StrictMode</code> mounts,
            unmounts and remounts every component to prove your cleanup works.
          </li>
        </ul>
      </Section>

      <Section title="Most of the time you do not need an effect">
        <p>
          This is the section that saves the most time. An effect that only reads state and
          writes other state is nearly always the wrong tool, and it costs an extra render
          every time.
        </p>

        <Code region="not-needed" label="three effects that should not exist" />

        <p>The test is a question: is this synchronising with something outside React?</p>
        <ul>
          <li>
            <strong>Calculated from props or state?</strong> Do it during render. No effect.
          </li>
          <li>
            <strong>Caused by a specific user action?</strong> Do it in the event handler. No
            effect.
          </li>
          <li>
            <strong>Needs to happen because the component is on screen?</strong> That is an
            effect.
          </li>
        </ul>
      </Section>

      <Section title="The dependency you keep re-creating">
        <p>
          Objects, arrays and functions declared in the component body are new values on every
          render, so an effect that depends on one runs on every render. The badge below
          counts how often each effect has fired.
        </p>

        <Example region="deps" column>
          <DependencyTrap />
        </Example>

        <p>
          The counts are read during render, so they show the state of play <em>before</em>{' '}
          this render's effects fire — click twice to see the gap open up.
        </p>

        <p>
          Fixes, in order of preference: move the value outside the component; move it inside
          the effect; depend on the primitive fields instead of the object; or wrap it in{' '}
          <code>useMemo</code> / <code>useCallback</code> as a last resort.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region title
// Captured once, when the module loads, so the cleanup always restores the
// real original rather than whatever the previous run of the effect wrote.
const ORIGINAL_TITLE = document.title

function TitleSync() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // document.title belongs to the browser, not to React, so keeping it in
    // step with our state is exactly what an effect is for.
    document.title = `${count} clicks — React by Example`
    return () => {
      document.title = ORIGINAL_TITLE
    }
  }, [count])

  return (
    <>
      <button onClick={() => setCount(count + 1)}>clicked {count} times</button>
      <Badge label="look at" value="the browser tab" tone="hot" />
    </>
  )
}
// #endregion

// #region clock
function Clock() {
  const [time, setTime] = useState(() => new Date())
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTime(new Date()), 1000)
    // Without this, pausing would leave the old interval running and starting
    // again would add a second one.
    return () => clearInterval(id)
  }, [running])

  return (
    <>
      <Badge label="now" value={time.toLocaleTimeString()} tone="hot" />
      <button onClick={() => setRunning(!running)}>{running ? 'pause' : 'resume'}</button>
    </>
  )
}
// #endregion

// #region listener
function WindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    function onResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <Badge label="window" value={`${size.w} × ${size.h}`} tone="hot" />
      <span style={{ fontSize: 13, color: '#5a6b7c' }}>resize the browser</span>
    </>
  )
}
// #endregion

// #region cleanup
function Subscriber({ onEvent }: { onEvent: (message: string) => void }) {
  useEffect(() => {
    onEvent('setup   — subscribed')
    return () => onEvent('cleanup — unsubscribed')
  }, [onEvent])

  return <Badge label="subscriber" value="mounted" tone="hot" />
}

function CleanupDemo() {
  const { lines, log, clear } = useLog()
  const [mounted, setMounted] = useState(false)

  return (
    <>
      <button onClick={() => setMounted(!mounted)}>{mounted ? 'unmount' : 'mount'}</button>
      <button onClick={clear}>clear log</button>
      {mounted && <Subscriber onEvent={log} />}
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region not-needed
// 1. Derived state. An effect here means two renders and a moment where the
//    screen disagrees with itself.
//
//    ❌  const [full, setFull] = useState('')
//        useEffect(() => setFull(first + ' ' + last), [first, last])
//    ✅  const full = first + ' ' + last
//
// 2. Reacting to a user action. The effect cannot tell *why* it ran, so it also
//    fires when the cart is restored from storage on load.
//
//    ❌  useEffect(() => { if (cart.length) showToast('Added!') }, [cart])
//    ✅  function handleAdd(item) { setCart([...cart, item]); showToast('Added!') }
//
// 3. Resetting state when a prop changes. Give the component a key instead and
//    let React throw the old instance away.
//
//    ❌  useEffect(() => setDraft(''), [userId])
//    ✅  <Editor key={userId} user={user} />
// #endregion

// #region deps
function DependencyTrap() {
  const [, force] = useState(0)
  const renders = useRenderCount()

  // Counted in refs rather than state: an effect that sets state on a
  // dependency that changes every render is an infinite loop, which is the
  // other half of this lesson's warning.
  const unstableRuns = useRef(0)
  const stableRuns = useRef(0)

  // A new object on every render. `{} !== {}`, so the effect below never sees
  // the same dependency twice and runs every single time.
  const options = { unit: 'metric' }

  useEffect(() => {
    unstableRuns.current += 1
  }, [options])

  // A string. Same value every render, so this effect runs once.
  useEffect(() => {
    stableRuns.current += 1
  }, [options.unit])

  return (
    <>
      <button onClick={() => force((n) => n + 1)}>re-render</button>
      <Badge label="renders" value={renders} />
      <Badge label="effect on [options]" value={unstableRuns.current} tone="hot" />
      <Badge label="effect on [options.unit]" value={stableRuns.current} />
    </>
  )
}
// #endregion
