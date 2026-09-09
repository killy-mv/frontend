/* eslint-disable react-hooks/refs --
   Three demos here read `ref.current` during render, which `react-hooks/refs`
   forbids. That is the point: RefVsState shows the stale number you get for
   doing it, and PreviousValue relies on the staleness deliberately. In your own
   code, read refs from handlers and effects. */

import { useEffect, useRef, useState } from 'react'
import { useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Section, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 13 — Refs
   ========================================================================== */

export default function RefsLesson() {
  return (
    <>
      <Lede>
        A ref is a box React keeps for you between renders, with one crucial difference from
        state: changing what is in the box does <em>not</em> re-render anything. That makes it
        the right home for two things — values the UI does not display, and handles to real
        DOM nodes.
      </Lede>

      <Section title="State or ref?">
        <Table
          head={['', 'useState', 'useRef']}
          rows={[
            ['Survives renders', 'yes', 'yes'],
            ['Changing it re-renders', <b key="a">yes</b>, <b key="b">no</b>],
            ['Read it during render', 'yes', 'no — it may be stale or unset'],
            ['Change it during render', 'no', 'no'],
            ['You write', <code key="c">setThing(x)</code>, <code key="d">ref.current = x</code>],
            ['Use it for', 'anything shown on screen', 'timer ids, DOM nodes, previous values'],
          ]}
        />

        <Note>
          The test is simple: <strong>if the screen should change when this value changes, it
          is state.</strong> If nothing on screen depends on it, a ref avoids a pointless
          render. Getting this backwards produces either a UI that will not update, or a
          component that renders sixty times a second.
        </Note>
      </Section>

      <Section title="A value that does not cause a render">
        <p>
          Both counters below increment on click. Only one of them causes React to do anything.
          Click the ref counter several times, then click "re-render" to see that the value was
          there all along.
        </p>

        <Example region="value" column>
          <RefVsState />
        </Example>
      </Section>

      <Section title="Holding a DOM node">
        <p>
          Sometimes you need the real element: to focus it, to scroll it, to measure it, to
          hand it to a non-React library. Pass a ref to the <code>ref</code> attribute and
          React puts the node in <code>.current</code> after it commits.
        </p>

        <Example region="dom" column>
          <DomRefs />
        </Example>

        <Note kind="warn">
          <code>ref.current</code> is <code>null</code> during the first render — the node does
          not exist yet. Read it in an event handler or an effect, never in the render body.
        </Note>
      </Section>

      <Section title="Measuring, in an effect">
        <p>
          Layout is something only the browser knows, so reading it is a side effect. Type into
          the box and watch the measured width of the text change.
        </p>

        <Example region="measure" column>
          <Measure />
        </Example>
      </Section>

      <Section title="Remembering the previous value">
        <p>
          A classic small use: keep the last value in a ref, updated in an effect. The render
          sees the old one, the effect writes the new one, and the next render sees what
          changed.
        </p>

        <Example region="previous" column>
          <PreviousValue />
        </Example>
      </Section>

      <Section title="Refs are a prop again">
        <p>
          For years a function component could not receive a <code>ref</code> — React consumed
          it, and you needed <code>forwardRef</code> to pass one through to an inner input. In
          React 19 <code>ref</code> is an ordinary prop of function components, and{' '}
          <code>forwardRef</code> is deprecated.
        </p>

        <Code region="forward" />
      </Section>

      <Section title="What not to do with them">
        <ul>
          <li>
            <strong>Do not read or write <code>ref.current</code> during render.</strong> It
            makes the component impure and the result depends on how many times React chose to
            render.
          </li>
          <li>
            <strong>Do not use refs to avoid a re-render you actually need.</strong> If the
            value is on the screen, it is state, however tempting the shortcut looks.
          </li>
          <li>
            <strong>Do not change DOM that React manages.</strong> Removing a node React thinks
            it owns will crash on the next render. Focus, scroll, select and measure are safe
            because React does not track them.
          </li>
        </ul>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region value
function RefVsState() {
  const [stateCount, setStateCount] = useState(0)
  const refCount = useRef(0)
  const renders = useRenderCount()

  return (
    <>
      <button onClick={() => setStateCount(stateCount + 1)}>state +1 (re-renders)</button>
      <Badge label="state" value={stateCount} tone="hot" />

      <button
        onClick={() => {
          // The value really does change. React simply is not watching, so the
          // number on screen stays where it was until something else renders.
          refCount.current += 1
        }}
      >
        ref +1 (no render)
      </button>
      <Badge label="ref.current" value={refCount.current} />

      <Badge label="renders" value={renders} />
    </>
  )
}
// #endregion

// #region dom
function DomRefs() {
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)

  return (
    <>
      <input ref={input} type="text" placeholder="focus me with the button" />
      <button onClick={() => input.current?.focus()}>focus</button>
      <button onClick={() => input.current?.select()}>select all</button>

      <div
        ref={box}
        className="mini"
        style={{ height: 90, overflow: 'auto', width: '100%' }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i}>scrollable line {i + 1}</div>
        ))}
      </div>
      <button onClick={() => box.current?.scrollTo({ top: 999, behavior: 'smooth' })}>
        scroll to the bottom
      </button>
    </>
  )
}
// #endregion

// #region measure
function Measure() {
  const [text, setText] = useState('measure me')
  const span = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)

  // Layout can only be read from the real DOM, and only after React has
  // written to it — which is what "after the commit" means.
  useEffect(() => {
    if (span.current) setWidth(Math.round(span.current.getBoundingClientRect().width))
  }, [text])

  return (
    <>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      <span ref={span} style={{ fontSize: 20, fontWeight: 600 }}>
        {text}
      </span>
      <Badge label="measured width" value={`${width}px`} tone="hot" />
    </>
  )
}
// #endregion

// #region previous
function PreviousValue() {
  const [value, setValue] = useState(5)
  const previous = useRef<number | null>(null)

  useEffect(() => {
    // Runs after the render, so during the render above `previous.current`
    // still holds the value from last time.
    previous.current = value
  }, [value])

  const direction =
    previous.current === null ? '—' : value > previous.current ? 'up' : value < previous.current ? 'down' : 'same'

  return (
    <>
      <button onClick={() => setValue(value - 1)}>−</button>
      <button onClick={() => setValue(value + 1)}>+</button>
      <Badge label="now" value={value} tone="hot" />
      <Badge label="previously" value={previous.current ?? '—'} />
      <Badge label="direction" value={direction} />
    </>
  )
}
// #endregion

// #region forward
// React 18 and earlier — ref had to be threaded through by hand:
//
//   const Input = forwardRef(function Input(props, ref) {
//     return <input ref={ref} {...props} />
//   })
//
// React 19 — ref is just a prop, so it destructures like any other:
//
//   function Input({ ref, ...props }) {
//     return <input ref={ref} {...props} />
//   }
//
// A ref can also be a function instead of an object. React calls it with the
// node on mount and with the cleanup on unmount, which is handy for lists:
//
//   <li ref={node => { map.set(id, node); return () => map.delete(id) }}>
// #endregion
