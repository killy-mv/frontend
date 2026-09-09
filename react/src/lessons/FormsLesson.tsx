import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { useLog } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 10 — Forms
   ========================================================================== */

export default function FormsLesson() {
  return (
    <>
      <Lede>
        An <code>&lt;input&gt;</code> already has its own memory — the browser keeps what you
        typed. A <em>controlled</em> input gives that job to React instead: state holds the
        value, the input displays it, and typing is just another event that updates state. One
        source of truth, and everything else falls out of it.
      </Lede>

      <Section title="The controlled input loop">
        <Snippet
          code={`const [name, setName] = useState('')

<input value={name} onChange={e => setName(e.target.value)} />

// keystroke → onChange → setName → re-render → value={new name}`}
        />

        <p>
          The input never changes itself. It renders whatever <code>value</code> says, and the
          only way <code>value</code> changes is through state. That closed loop is what makes
          validation, formatting and a live preview trivial — they are all just reading the same
          variable.
        </p>

        <Example region="controlled" column>
          <Controlled />
        </Example>

        <Note kind="warn">
          <strong><code>value</code> without <code>onChange</code> makes a read-only box.</strong>{' '}
          React warns about it in the console. If you meant "start with this text but let the
          user own it", use <code>defaultValue</code> — that is an uncontrolled input.
        </Note>
      </Section>

      <Section title="Every kind of field">
        <Table
          head={['Element', 'Prop that holds the value', 'Read it from']}
          rows={[
            [<code key="1">text, number, textarea</code>, <code key="2">value</code>, <code key="3">e.target.value</code>],
            [<code key="4">checkbox</code>, <code key="5">checked</code>, <code key="6">e.target.checked</code>],
            [<code key="7">radio</code>, <code key="8">checked</code>, <code key="9">e.target.value</code>],
            [<code key="10">select</code>, <code key="11">value</code>, <code key="12">e.target.value</code>],
            [<code key="13">multi-select</code>, <code key="14">value (array)</code>, <code key="15">e.target.selectedOptions</code>],
            [<code key="16">file</code>, <code key="17">— always uncontrolled</code>, <code key="18">e.target.files</code>],
          ]}
        />

        <p>
          Two React-specific spellings: <code>&lt;textarea&gt;</code> takes a{' '}
          <code>value</code> prop rather than children, and <code>&lt;select&gt;</code> takes{' '}
          <code>value</code> on the select rather than <code>selected</code> on an option.
        </p>

        <Example region="fields" column>
          <AllFields />
        </Example>
      </Section>

      <Section title="One object for the whole form">
        <p>
          A state hook per field gets tedious past three or four. Keep an object and write a
          single change handler keyed on the input's <code>name</code> — remembering to spread,
          because state must be replaced rather than edited.
        </p>

        <Example region="object" column>
          <ObjectForm />
        </Example>
      </Section>

      <Section title="Submitting">
        <p>
          <code>onSubmit</code> goes on the <code>&lt;form&gt;</code>, not on the button, so
          that pressing Enter in a field works too. Then call{' '}
          <code>e.preventDefault()</code> — without it the browser posts the form and reloads
          the page, which in a single page app means throwing the entire application away.
        </p>

        <Example region="submit" column>
          <SubmitDemo />
        </Example>

        <p>
          Validation is just derived state: compute the errors during render from the values
          you already have. Nothing needs storing, so nothing can go stale.
        </p>
      </Section>

      <Section title="Uncontrolled inputs, for completeness">
        <p>
          The alternative is to let the DOM keep the value and read it only when you need it,
          via a ref. Less code, fewer renders, no live validation. It is the right choice for
          simple forms and the only choice for <code>&lt;input type="file"&gt;</code>.
        </p>

        <Code region="uncontrolled" />
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region controlled
function Controlled() {
  const [name, setName] = useState('')

  return (
    <>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="your name"
      />

      {/* Everything below is derived from the one piece of state. */}
      <Badge label="state" value={name || '(empty)'} tone="hot" />
      <Badge label="length" value={name.length} />
      <button onClick={() => setName(name.toUpperCase())} disabled={!name}>
        SHOUT
      </button>
      <button onClick={() => setName('')} disabled={!name}>
        clear
      </button>
    </>
  )
}
// #endregion

// #region fields
function AllFields() {
  const [text, setText] = useState('hello')
  const [agreed, setAgreed] = useState(false)
  const [size, setSize] = useState('m')
  const [colour, setColour] = useState('blue')

  return (
    <>
      <label>
        text
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      <label>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        checkbox uses `checked`
      </label>

      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        {['s', 'm', 'l'].map((s) => (
          <label key={s}>
            <input
              type="radio"
              name="size"
              value={s}
              checked={size === s}
              onChange={(e) => setSize(e.target.value)}
            />
            {s.toUpperCase()}
          </label>
        ))}
      </fieldset>

      <label>
        select
        {/* value on the <select>, not `selected` on an <option> */}
        <select value={colour} onChange={(e) => setColour(e.target.value)}>
          <option value="red">red</option>
          <option value="blue">blue</option>
          <option value="green">green</option>
        </select>
      </label>

      <Badge label="state" value={JSON.stringify({ text, agreed, size, colour })} tone="hot" />
    </>
  )
}
// #endregion

// #region object
type Fields = { name: string; email: string; newsletter: boolean }

function ObjectForm() {
  const [form, setForm] = useState<Fields>({ name: '', email: '', newsletter: false })

  // One handler for every input. The spread is what makes it a *new* object,
  // which is what makes React re-render.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <>
      <input name="name" value={form.name} onChange={handleChange} placeholder="name" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="email" />
      <label>
        <input
          name="newsletter"
          type="checkbox"
          checked={form.newsletter}
          onChange={handleChange}
        />
        newsletter
      </label>
      <pre className="out">{JSON.stringify(form, null, 2)}</pre>
    </>
  )
}
// #endregion

// #region submit
function SubmitDemo() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { lines, log } = useLog()

  // Derived during render — never stored, so it can never be stale.
  const error =
    email === '' ? 'Email is required' : !email.includes('@') ? 'That is not an email' : null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Without this the browser navigates and the whole SPA restarts.
    e.preventDefault()
    if (error) return
    log('submitted', email)
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="text"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setSent(false)
        }}
        placeholder="press Enter to submit"
      />
      <button type="submit" disabled={error !== null}>
        Subscribe
      </button>
      {error && <Badge label="invalid" value={error} />}
      {sent && <Badge label="ok" value="sent" tone="hot" />}
      <Out lines={lines} />
    </form>
  )
}
// #endregion

// #region uncontrolled
// The DOM keeps the value; React reads it once, on submit.
//
//   function Search() {
//     const input = useRef(null)
//
//     function handleSubmit(e) {
//       e.preventDefault()
//       console.log(input.current.value)     // read it when you need it
//     }
//
//     return (
//       <form onSubmit={handleSubmit}>
//         <input ref={input} defaultValue="react" />
//         <button>Go</button>
//       </form>
//     )
//   }
//
// No state, no render per keystroke — and no way to react to what is typed.
// Controlled is the default; uncontrolled is the optimisation.
// #endregion
