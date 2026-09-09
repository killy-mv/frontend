import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { useLog } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 4 — Props
   ========================================================================== */

export default function PropsLesson() {
  return (
    <>
      <Lede>
        Props are the arguments to a component. React collects the JSX attributes into a
        single object and calls your function with it. They are read-only on purpose: a
        component can be handed data, but only whoever owns that data may change it.
      </Lede>

      <Section title="They are just a parameter object">
        <Snippet
          code={`<Greeting name="Ada" excited />

// arrives as one argument:
function Greeting(props) {
  props // { name: 'Ada', excited: true }
}

// almost always destructured, with defaults, in the signature:
function Greeting({ name, excited = false }) {
  return <p>Hello, {name}{excited ? '!' : '.'}</p>
}`}
        />

        <p>
          A bare attribute like <code>excited</code> means <code>excited={'{true}'}</code>. Any
          other value needs braces — <code>count={'{3}'}</code>, <code>items={'{list}'}</code>,{' '}
          <code>onSave={'{handleSave}'}</code>. Quotes only ever produce a string.
        </p>

        <Example region="basics" column>
          <Greeting name="Ada" excited />
        </Example>
      </Section>

      <Section title="Anything can be a prop">
        <p>
          Numbers, arrays, objects, functions, and other elements. TypeScript is how you write
          down what a component expects; the type is worth reading as documentation.
        </p>

        <Example region="kinds" column>
          <KindsDemo />
        </Example>
      </Section>

      <Section title="Data down, events up">
        <p>
          This is the shape almost every React app has. The parent owns the state. Children
          get the current value as a prop and a <em>function</em> to call when the user does
          something. The child never changes the value; it reports an intention and the parent
          decides.
        </p>

        <Example region="flow" column>
          <Thermostat />
        </Example>

        <p>
          <code>TempButton</code> and <code>Readout</code> have no state at all. Give them
          different props and they render differently — which makes them trivial to reuse and
          trivial to test.
        </p>
      </Section>

      <Section title="Props are read-only">
        <p>
          Assigning to a prop is a bug even when the language lets you. The parent will
          re-render at some point, pass the original value again, and your change vanishes —
          or worse, you mutate an object the parent is still holding and nothing re-renders at
          all, because React never saw a state change.
        </p>

        <Code region="readonly" label="don't" />

        <Note>
          If a component wants to change something, one of two things is true: it is a value
          only that component cares about, so it should be <em>state</em> there; or someone
          else owns it, so the component needs an <code>onChange</code>-style prop. There is
          no third option, and no way to write "up" a prop.
        </Note>
      </Section>

      <Section title="Spreading, and the props you never receive">
        <p>
          <code>{'<Button {...rest} />'}</code> forwards every remaining prop, which is how
          wrapper components stay transparent. Two names are special and never arrive in{' '}
          <code>props</code>:
        </p>
        <ul>
          <li>
            <code>key</code> — consumed by React to match elements between renders. Reading{' '}
            <code>props.key</code> gives <code>undefined</code>; pass it again under another
            name if the child genuinely needs the id.
          </li>
          <li>
            <code>ref</code> — historically also consumed by React. In React 19 function
            components receive it as a normal prop, so <code>forwardRef</code> is no longer
            needed. See the Refs lesson.
          </li>
        </ul>

        <Example region="spread" column>
          <SpreadDemo />
        </Example>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region basics
function Greeting({ name, excited = false }: { name: string; excited?: boolean }) {
  return (
    <p className="mini">
      Hello, {name}
      {excited ? '!' : '.'}
    </p>
  )
}
// #endregion

// #region kinds
type ReceiptProps = {
  title: string
  lines: Array<{ label: string; amount: number }>
  currency?: string
  footer?: ReactNode
  onPrint: (total: number) => void
}

function Receipt({ title, lines, currency = '£', footer, onPrint }: ReceiptProps) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0)

  return (
    <div className="mini" style={{ minWidth: 260 }}>
      <b>{title}</b>
      <ul className="plain">
        {lines.map((l) => (
          <li key={l.label}>
            <span style={{ flex: 1 }}>{l.label}</span>
            {currency}
            {l.amount.toFixed(2)}
          </li>
        ))}
      </ul>
      {footer}
      <button onClick={() => onPrint(total)} style={{ marginTop: 8 }}>
        Print total
      </button>
    </div>
  )
}

function KindsDemo() {
  const { lines, log } = useLog()

  return (
    <>
      <Receipt
        title="Coffee run"
        lines={[
          { label: 'Flat white', amount: 3.4 },
          { label: 'Croissant', amount: 2.6 },
        ]}
        footer={<small style={{ color: '#8a99a8' }}>an element passed as a prop</small>}
        onPrint={(total) => log('onPrint called with total', total)}
      />
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region flow
function Readout({ celsius }: { celsius: number }) {
  // No state. Same props in, same markup out.
  const mood = celsius < 16 ? 'cold' : celsius > 24 ? 'too warm' : 'comfortable'
  return (
    <>
      <Badge label="celsius" value={celsius} tone="hot" />
      <Badge label="verdict" value={mood} />
    </>
  )
}

function TempButton({ by, onAdjust }: { by: number; onAdjust: (by: number) => void }) {
  // It cannot change the temperature. It can only say "the user pressed me".
  return <button onClick={() => onAdjust(by)}>{by > 0 ? `+${by}` : by}</button>
}

function Thermostat() {
  // The parent owns the value, so the parent is the only thing that changes it.
  const [celsius, setCelsius] = useState(20)

  function adjust(by: number) {
    setCelsius((c) => Math.min(30, Math.max(5, c + by)))
  }

  return (
    <>
      <TempButton by={-1} onAdjust={adjust} />
      <TempButton by={+1} onAdjust={adjust} />
      <Readout celsius={celsius} />
    </>
  )
}
// #endregion

// #region readonly
// This compiles and does nothing useful:
//
//   function Label({ text }) {
//     text = text.toUpperCase()      // a local variable, thrown away next render
//     return <span>{text}</span>
//   }
//
// This is worse, because it changes data the parent still owns and no re-render
// is scheduled, so the screen and the data disagree:
//
//   function Row({ item }) {
//     item.seen = true               // mutating a prop object
//     return <li>{item.name}</li>
//   }
//
// Right: derive a new value during render, or ask the owner to change it.
//
//   const shouted = text.toUpperCase()
//   <li onClick={() => onSeen(item.id)}>{item.name}</li>
// #endregion

// #region spread
type ChipProps = ComponentProps<'button'> & { tone?: 'hot' }

function Chip({ tone, children, ...rest }: ChipProps) {
  // `rest` is everything this component did not name: onClick, disabled, title,
  // aria-*, anything. Forwarding it keeps the wrapper transparent.
  return (
    <button className={tone ? `badge ${tone}` : 'badge'} {...rest}>
      {children}
    </button>
  )
}

function SpreadDemo() {
  const { lines, log } = useLog()

  return (
    <>
      <Chip onClick={() => log('plain chip clicked')} title="a forwarded title attribute">
        click me
      </Chip>
      <Chip tone="hot" disabled>
        disabled, also forwarded
      </Chip>
      <Out lines={lines} />
    </>
  )
}
// #endregion
