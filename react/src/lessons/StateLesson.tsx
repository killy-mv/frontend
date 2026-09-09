/* eslint-disable react-hooks/immutability --
   BrokenCounter below reassigns a local variable after render, which is exactly
   the mistake the section "Why a variable is not enough" is demonstrating. The
   linter catching it without being asked is a good advert for `npm run lint`. */

import { useState } from 'react'
import { useLog, useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 5 — State
   ========================================================================== */

export default function StateLesson() {
  return (
    <>
      <Lede>
        State is a component's memory: a value React holds onto between renders, and watches.
        Change it and React re-runs the component function, gets back a new description of the
        UI, and updates the DOM to match. You never write "update the screen" — you update the
        value, and the screen updating is the consequence.
      </Lede>

      <Section title="Why a variable is not enough">
        <p>
          The two counters below have identical markup and identical click handlers. The left
          one keeps its number in a plain <code>let</code>; the right one keeps it in state.
          Click both several times.
        </p>

        <Example region="broken-vs-state" column>
          <BrokenVsState />
        </Example>

        <p>The <code>let</code> version fails twice over, and for two different reasons:</p>
        <ol>
          <li>
            <strong>Nothing tells React to re-render.</strong> The function has already
            returned; React is not watching your local variables.
          </li>
          <li>
            <strong>The variable does not survive anyway.</strong> Even if something else
            forced a render, the function would run again from the top and{' '}
            <code>let count = 0</code> would reset it.
          </li>
        </ol>
        <p>
          <code>useState</code> fixes both: the value is stored outside the function, and
          calling the setter is what schedules the re-render.
        </p>
      </Section>

      <Section title="The two things useState gives you">
        <Snippet
          code={`const [count, setCount] = useState(0)
//     ^^^^^  ^^^^^^^^          ^
//     |      |                 the value used on the FIRST render only
//     |      the setter: writes the value AND schedules a re-render
//     this render's value — a const, and it never changes mid-render`}
        />

        <p>
          It returns an array of exactly two things, so it is always destructured. The names
          are yours; <code>[thing, setThing]</code> is the universal convention.
        </p>

        <Note>
          <strong><code>count</code> is a <code>const</code>, and that is not an accident.</strong>{' '}
          Within one render the value is frozen. Calling <code>setCount(5)</code> does not
          change <code>count</code> — it tells React "next time you render this component, hand
          it 5". The State-as-a-snapshot lesson is entirely about this.
        </Note>
      </Section>

      <Section title="Watch the render happen">
        <p>
          The badge counts how many times the component function has run. Type in the box: a
          render for every keystroke. Click the button that sets state to the value it already
          has: no render, because React bails out when the new value is <code>Object.is</code>-equal
          to the old one.
        </p>

        <Example region="renders" column>
          <RenderWatcher />
        </Example>

        <Note kind="warn">
          The count climbs in <strong>twos</strong>. That is{' '}
          <code>&lt;StrictMode&gt;</code> deliberately running every render twice in
          development to expose impure components. Production renders once. See the Purity
          lesson.
        </Note>
      </Section>

      <Section title="State is per instance, and it is private">
        <p>
          Each place a component appears gets its own state cell. Nothing outside can read it
          or write it. If two components need the same value, it does not belong in either of
          them — see Lifting State Up.
        </p>

        <Example region="private" column>
          <ThreeChips />
        </Example>
      </Section>

      <Section title="The initial value is only ever used once">
        <p>
          After the first render React ignores the argument entirely. So this does not do what
          it looks like it does:
        </p>

        <Snippet
          code={`function Editor({ initialText }) {
  const [text, setText] = useState(initialText)
  // Changing the initialText prop later will NOT update text.
  // React only read that argument on the first render.
}`}
        />

        <p>
          If the argument is expensive to produce, pass a <em>function</em> instead of a value.
          React calls it once; otherwise you pay the cost on every single render and throw the
          result away.
        </p>

        <Example region="lazy" column>
          <LazyInit />
        </Example>
      </Section>

      <Section title="Replace state, never edit it">
        <p>
          React decides whether to re-render by comparing the old value to the new one with{' '}
          <code>Object.is</code>. Push onto an array in place and the reference has not
          changed, so as far as React is concerned nothing happened — even though your data is
          now different from what is on screen.
        </p>

        <Example region="mutation" column>
          <MutationDemo />
        </Example>

        <Table
          head={['Instead of', 'Write']}
          rows={[
            [<code key="1">arr.push(x)</code>, <code key="2">setArr([...arr, x])</code>],
            [<code key="3">arr.splice(i, 1)</code>, <code key="4">{'setArr(arr.filter((_, j) => j !== i))'}</code>],
            [<code key="5">arr[i].done = true</code>, <code key="6">{'setArr(arr.map((v, j) => j === i ? { ...v, done: true } : v))'}</code>],
            [<code key="7">obj.name = x</code>, <code key="8">{'setObj({ ...obj, name: x })'}</code>],
            [<code key="9">obj.a.b = x</code>, <code key="10">{'setObj({ ...obj, a: { ...obj.a, b: x } })'}</code>],
            [<code key="11">arr.sort()</code>, <code key="12">setArr([...arr].sort())</code>],
          ]}
        />

        <Note>
          The rule of thumb: <code>push</code>, <code>pop</code>, <code>splice</code>,{' '}
          <code>sort</code> and <code>reverse</code> mutate, so they are wrong for state.{' '}
          <code>map</code>, <code>filter</code>, <code>concat</code>, <code>slice</code> and
          spread return something new, so they are right.
        </Note>
      </Section>

      <Section title="What belongs in state">
        <p>
          Less than people put there. Anything you can calculate from existing state or props
          should be calculated during render, not stored — because two stored values can
          disagree, and a derived one cannot.
        </p>

        <Code region="derived" label="derived, not stored" />
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region broken-vs-state
function BrokenCounter() {
  // A local variable. Created fresh every render, and changing it tells
  // React nothing at all.
  let count = 0

  return (
    <button
      onClick={() => {
        count = count + 1
        console.log('the variable really is', count, '— the screen just never hears about it')
      }}
    >
      broken: {count}
    </button>
  )
}

function WorkingCounter() {
  // A state cell. React keeps it between renders, and setCount is what
  // schedules the next render.
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>state: {count}</button>
}

function BrokenVsState() {
  return (
    <>
      <BrokenCounter />
      <WorkingCounter />
    </>
  )
}
// #endregion

// #region renders
function RenderWatcher() {
  const [text, setText] = useState('')
  const renders = useRenderCount()

  return (
    <>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="every keystroke is a render"
      />
      <Badge label="renders" value={renders} tone="hot" />
      <Badge label="length" value={text.length} />
      {/* Setting state to the value it already holds is a no-op: React
          compares with Object.is and skips the re-render. */}
      <button onClick={() => setText(text)}>setText(text) — no render</button>
      <button onClick={() => setText('')} disabled={text === ''}>
        clear
      </button>
    </>
  )
}
// #endregion

// #region private
function Chip({ name }: { name: string }) {
  const [on, setOn] = useState(false)

  return (
    <button className={on ? 'badge hot' : 'badge'} onClick={() => setOn(!on)}>
      {name} {on ? 'on' : 'off'}
    </button>
  )
}

function ThreeChips() {
  // One component, three independent memories. Nothing here can read them.
  return (
    <>
      <Chip name="alpha" />
      <Chip name="beta" />
      <Chip name="gamma" />
    </>
  )
}
// #endregion

// #region lazy
function expensiveSetup(): string[] {
  const words: string[] = []
  for (let i = 0; i < 20000; i++) words.push(`item-${i}`)
  return words.slice(0, 3)
}

function LazyInit() {
  const [, force] = useState(0)

  // WRONG: expensiveSetup() runs on every render, and its result is discarded
  // on every render but the first.
  //   const [eager] = useState(expensiveSetup())

  // RIGHT: pass the function itself. React calls it once, on mount.
  const [sample] = useState(expensiveSetup)

  return (
    <>
      <Badge label="built once" value={sample.join(', ')} />
      <button onClick={() => force((n) => n + 1)}>re-render (setup does not run again)</button>
    </>
  )
}
// #endregion

// #region mutation
function MutationDemo() {
  const [items, setItems] = useState(['one'])
  const { lines, log } = useLog()

  function mutate() {
    // The array object is the same object, so Object.is says nothing changed
    // and React does not re-render. The data and the screen now disagree.
    items.push(`item ${items.length + 1}`)
    log('after push, the array holds', items.length, 'items — but the list above did not move')
  }

  function replace() {
    // A new array. Different reference, so React re-renders.
    setItems([...items, `item ${items.length + 1}`])
  }

  return (
    <>
      <Badge label="rendered items" value={items.join(', ')} tone="hot" />
      <button onClick={mutate}>items.push(…) — mutates</button>
      <button onClick={replace}>setItems([...items, …]) — replaces</button>
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region derived
// Three pieces of state that can disagree with each other:
//
//   const [items, setItems] = useState([])
//   const [count, setCount] = useState(0)          // redundant
//   const [hasItems, setHasItems] = useState(false) // redundant
//
// One piece of state, and two values worked out during render:
//
//   const [items, setItems] = useState([])
//   const count = items.length
//   const hasItems = items.length > 0
//
// The derived versions cannot drift, cost nothing to keep in sync, and delete
// two bugs you would otherwise have to remember not to write.
// #endregion
