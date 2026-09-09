import { useState } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 11 — Lifting state up
   ========================================================================== */

export default function LiftingLesson() {
  return (
    <>
      <Lede>
        State is private to the component that owns it, so two components can never see each
        other's. When they need to agree on something, the answer is always the same: move the
        state to the nearest parent they share, and pass it back down as props. That move has
        a name, and it is the main structural decision you make in a React app.
      </Lede>

      <Section title="The problem">
        <p>
          Two temperature boxes, one in Celsius and one in Fahrenheit, each holding its own
          state. They are supposed to stay in sync. They cannot.
        </p>

        <Example region="broken" column>
          <BrokenPair />
        </Example>
      </Section>

      <Section title="The fix, in three steps">
        <ol>
          <li>
            <strong>Remove the state from the children.</strong> They take a{' '}
            <code>value</code> prop and an <code>onChange</code> prop instead. A component
            with no state of its own is called <em>controlled</em>.
          </li>
          <li>
            <strong>Put the state in the closest common parent.</strong> Here that is the
            panel wrapping both inputs.
          </li>
          <li>
            <strong>Pass it down.</strong> Value goes down as a prop, changes come back up as
            a function call — the same shape as the Props lesson, just used deliberately.
          </li>
        </ol>

        <Example region="lifted" column>
          <TemperaturePanel />
        </Example>

        <Note>
          Notice what got simpler. There is now <em>one</em> number in the whole feature. The
          Fahrenheit box is not stored anywhere — it is calculated from the Celsius state
          during render. Two things that must agree cannot disagree if only one of them
          exists.
        </Note>
      </Section>

      <Section title="Controlled or uncontrolled — it is a design decision">
        <p>
          The same component can be written either way, and the difference is only where the
          state lives:
        </p>

        <Snippet
          code={`// uncontrolled: owns its state, parent cannot influence it
function Toggle() {
  const [on, setOn] = useState(false)
  return <button onClick={() => setOn(!on)}>{on ? 'on' : 'off'}</button>
}

// controlled: state lives somewhere else, this is pure display
function Toggle({ on, onToggle }) {
  return <button onClick={onToggle}>{on ? 'on' : 'off'}</button>
}`}
        />

        <p>
          Start uncontrolled — it is less code and less plumbing. Lift when a second component
          needs the value. Do not lift preemptively "in case"; state that has been hoisted too
          far re-renders half the tree for no reason and makes every component harder to read.
        </p>
      </Section>

      <Section title="Sharing between siblings">
        <p>
          The classic case: an accordion where opening one section closes the others. No
          section can know about the others, so the index of the open one lives in the parent.
        </p>

        <Example region="accordion" column>
          <Accordion />
        </Example>
      </Section>

      <Section title="When lifting stops being enough">
        <p>
          Lifting works until the common parent is a long way up and the value has to be
          threaded through five components that do not care about it. That is called{' '}
          <em>prop drilling</em>, and it is the problem Context solves — the next lesson but
          one. For state that is complex rather than merely distant, useReducer is the answer
          instead.
        </p>

        <Code region="drilling" />
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region broken
function LonelyInput({ label }: { label: string }) {
  // Private state. Nothing outside this component can read or change it.
  const [value, setValue] = useState('')

  return (
    <label>
      {label}
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  )
}

function BrokenPair() {
  return (
    <>
      <LonelyInput label="°C " />
      <LonelyInput label="°F " />
      <Badge label="problem" value="two states, no way to sync them" />
    </>
  )
}
// #endregion

// #region lifted
// Step 1: no state. Value in, change events out.
function TemperatureInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label>
      {label}
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

// Step 2: the closest common parent owns the single source of truth.
function TemperaturePanel() {
  const [celsius, setCelsius] = useState('20')

  // Step 3: everything else is derived, so it cannot fall out of sync.
  const c = Number(celsius)
  const fahrenheit = Number.isNaN(c) ? '' : String(Math.round((c * 9) / 5 + 32))

  return (
    <>
      <TemperatureInput label="°C " value={celsius} onChange={setCelsius} />
      <TemperatureInput
        label="°F "
        value={fahrenheit}
        onChange={(f) => setCelsius(String(Math.round(((Number(f) - 32) * 5) / 9)))}
      />
      <Badge label="the only state" value={`celsius = ${celsius}`} tone="hot" />
      <Badge label="verdict" value={c >= 100 ? 'boiling' : c <= 0 ? 'freezing' : 'liquid'} />
    </>
  )
}
// #endregion

// #region accordion
const SECTIONS = [
  { title: 'Components', body: 'Functions that return UI.' },
  { title: 'Props', body: 'Read-only inputs to those functions.' },
  { title: 'State', body: 'Memory that survives between renders.' },
]

function Panel({
  title,
  body,
  isOpen,
  onOpen,
}: {
  title: string
  body: string
  isOpen: boolean
  onOpen: () => void
}) {
  // No state here. Whether it is open is not this component's business —
  // it depends on the others, so the parent decides.
  return (
    <div className="mini" style={{ width: '100%' }}>
      <b>{title}</b>
      {isOpen ? <p style={{ margin: '6px 0 0' }}>{body}</p> : <button onClick={onOpen}>show</button>}
    </div>
  )
}

function Accordion() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <>
      {SECTIONS.map((s, i) => (
        <Panel
          key={s.title}
          title={s.title}
          body={s.body}
          isOpen={openIndex === i}
          onOpen={() => setOpenIndex(i)}
        />
      ))}
    </>
  )
}
// #endregion

// #region drilling
// Lifting has a cost, and this is what it looks like when it gets too high:
//
//   <App theme={theme} setTheme={setTheme}>
//     <Layout theme={theme} setTheme={setTheme}>          // does not use it
//       <Sidebar theme={theme} setTheme={setTheme}>       // does not use it
//         <Settings theme={theme} setTheme={setTheme}>    // does not use it
//           <ThemePicker theme={theme} setTheme={setTheme} />   // finally
//
// Three components carry a prop only to hand it on. Adding a fourth setting
// means touching all of them. Context removes the middle rows entirely.
// #endregion
