/* eslint-disable react-hooks/globals --
   ImpureCounter at the bottom of this file mutates a module-level variable
   during render, on purpose, so the page can show what goes wrong.
   `react-hooks/globals` is the rule that would have stopped you. */

import { useEffect, useState } from 'react'
import { useLog, useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 19 — Purity and StrictMode
   ========================================================================== */

export default function PurityLesson() {
  return (
    <>
      <Lede>
        React reserves the right to call your component whenever it likes, as often as it
        likes, and to throw the result away. That is only safe if rendering is{' '}
        <strong>pure</strong>: same props and state in, same JSX out, nothing else touched
        along the way. Every rule in this lesson is a consequence of that one contract.
      </Lede>

      <Section title="What pure means here">
        <p>During render — the body of your component function — you may not:</p>
        <ul>
          <li>change variables that existed before the render started</li>
          <li>mutate props, state, or any object you did not create in this render</li>
          <li>set state (that is an infinite loop, and React will tell you so)</li>
          <li>
            read or write the DOM, <code>localStorage</code>, network, timers, or{' '}
            <code>ref.current</code>
          </li>
          <li>
            call <code>Math.random()</code> or <code>new Date()</code> and expect it to be
            stable
          </li>
        </ul>

        <p>
          Everything on that list has a home: an event handler if it happens because the user
          did something, an effect if it happens because the component is on screen, or the
          lazy initialiser of <code>useState</code> if it happens once.
        </p>

        <Code region="impure" label="the same component, twice" />
      </Section>

      <Section title="An impure component, misbehaving">
        <p>
          The counter below mutates a variable outside itself during render. It looks fine
          until something else causes a render, and then the number jumps — because it counts
          renders rather than clicks, and renders are not yours to predict.
        </p>

        <Example region="impure-demo" column>
          <ImpureCounter />
        </Example>
      </Section>

      <Section title="StrictMode: React double-checking you">
        <p>
          <code>src/main.tsx</code> wraps this whole app in <code>&lt;StrictMode&gt;</code>. In
          development — and only in development — it deliberately does three things twice:
        </p>
        <ul>
          <li>calls every component function twice</li>
          <li>calls every reducer and every state initialiser twice</li>
          <li>
            mounts each component, runs its effects, runs the cleanups, and mounts it again
          </li>
        </ul>

        <p>
          If your code is pure and your effects clean up after themselves, none of that is
          observable. If it is not, the bug surfaces on your machine in a second rather than in
          production in a month. The log below shows the mount / cleanup / mount cycle.
        </p>

        <Example region="strict" column>
          <StrictLog />
        </Example>

        <Note>
          <strong>This is why every render badge on this site counts in twos.</strong> Build
          for production (<code>npm run build &amp;&amp; npm run preview</code>) and the numbers
          halve, because <code>StrictMode</code> is stripped out.
        </Note>
      </Section>

      <Section title="Local mutation is fine">
        <p>
          The rule is about things that outlive the render, not about the keyword{' '}
          <code>let</code>. Building up an array you created two lines ago is perfectly pure —
          nobody outside can tell.
        </p>

        <Snippet
          code={`function Table({ rows }) {
  const cells = []                    // created during this render
  for (const row of rows) {
    cells.push(<Cell key={row.id} row={row} />)   // fine: it is ours
  }
  return <tbody>{cells}</tbody>
}

// Not fine — \`total\` was created before this render and is shared:
let total = 0
function Row({ price }) {
  total += price                      // two renders, two different answers
  return <td>{total}</td>
}`}
        />
      </Section>

      <Section title="The rules of hooks, one more time">
        <p>
          React matches your hooks to their stored values by <strong>call order</strong>. The
          first <code>useState</code> in a component gets the first cell, and so on. Nothing
          knows the names.
        </p>

        <Snippet
          code={`// render 1: id is set          render 2: id is undefined
useState()   → cell 1          useState()   → never reached
useEffect()  → cell 2          //              early return happened first
useState()   → cell 3

// Cell 3's value is now handed to whatever hook takes its place.`}
        />

        <ul>
          <li>
            <strong>Top level only</strong> — no conditions, loops, nested functions, or code
            after an early <code>return</code>.
          </li>
          <li>
            <strong>From components and hooks only</strong> — not from event handlers, class
            methods, or ordinary functions.
          </li>
        </ul>

        <p>
          <code>eslint-plugin-react-hooks</code> is configured in{' '}
          <code>eslint.config.js</code> and enforces both, plus the dependency arrays. Run{' '}
          <code>npm run lint</code>. Treating its warnings as errors is the single highest-value
          habit in React.
        </p>
      </Section>

      <Section title="Why any of this is worth the discipline">
        <p>
          Purity is not aesthetics. It is what lets React interrupt a render halfway through
          and start again with fresher data, render a component on a server and reuse the
          result, skip a component whose inputs did not change, and — with the React Compiler —
          insert memoisation automatically because it can prove the function has no other
          effects.
        </p>
        <p>
          Impure components do not fail loudly. They work, and then behave differently under
          concurrent rendering, or in production, or on a slow connection. The rules above are
          the price of everything React does on your behalf.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region impure
// ❌ impure: reads and writes something outside the render
//
//   let calls = 0
//   function Impure() {
//     calls++                              // survives the render
//     return <p>{calls}</p>
//   }
//
//   function AlsoImpure({ items }) {
//     items.sort()                         // mutates a prop
//     return <List items={items} />
//   }
//
//   function StillImpure({ user }) {
//     document.title = user.name           // touches the DOM during render
//     return <h1>{user.name}</h1>
//   }
//
// ✅ pure: everything it touches, it made
//
//   function Pure({ count }) {
//     return <p>{count}</p>
//   }
//
//   function AlsoPure({ items }) {
//     const sorted = [...items].sort()     // a copy
//     return <List items={sorted} />
//   }
//
//   function StillPure({ user }) {
//     useEffect(() => { document.title = user.name }, [user.name])
//     return <h1>{user.name}</h1>
//   }
// #endregion

// #region impure-demo
// Declared outside the component, so it survives every render — and every
// render adds to it, whether or not the user did anything.
let impureTotal = 0

function ImpureCounter() {
  impureTotal += 1

  const [, force] = useState(0)
  const renders = useRenderCount()

  return (
    <>
      <Badge label="impure total" value={impureTotal} />
      <Badge label="renders" value={renders} tone="hot" />
      <button onClick={() => force((n) => n + 1)}>re-render (the total moves too)</button>
      <span style={{ fontSize: 13, color: '#5a6b7c' }}>
        navigate away and back — it keeps climbing
      </span>
    </>
  )
}
// #endregion

// #region strict
function Probe({ id, onEvent }: { id: string; onEvent: (line: string) => void }) {
  useEffect(() => {
    onEvent(`mount   ${id}`)
    return () => onEvent(`cleanup ${id}`)
  }, [id, onEvent])

  return <Badge label="probe" value={id} tone="hot" />
}

function StrictLog() {
  const { lines, log, clear } = useLog()
  const [shown, setShown] = useState(false)
  const [mounts, setMounts] = useState(0)

  return (
    <>
      <button
        onClick={() => {
          // Counted in the handler, where side effects belong — not in render,
          // which is the whole point of this lesson.
          if (!shown) setMounts((m) => m + 1)
          setShown(!shown)
        }}
      >
        {shown ? 'unmount probe' : 'mount probe'}
      </button>
      <button onClick={clear}>clear</button>
      {shown && <Probe id={`#${mounts}`} onEvent={log} />}
      <Out lines={lines} />
      <span style={{ fontSize: 13, color: '#5a6b7c' }}>
        In development you get mount → cleanup → mount. In production, just mount.
      </span>
    </>
  )
}
// #endregion
