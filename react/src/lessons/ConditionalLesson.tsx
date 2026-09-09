import type { ReactNode } from 'react'
import { useState } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 8 — Conditional rendering
   ========================================================================== */

export default function ConditionalLesson() {
  return (
    <>
      <Lede>
        There is no <code>v-if</code> and no <code>{'{% if %}'}</code>. JSX is JavaScript, so
        showing something conditionally is done with the language: an <code>if</code> before
        the return, a ternary inside it, or <code>&&</code>. The only thing worth memorising
        is which values render as nothing.
      </Lede>

      <Section title="The four ways">
        <Snippet
          code={`// 1. if, before the JSX — best when the branches differ a lot
if (!user) return <SignIn />
return <Dashboard user={user} />

// 2. ternary, inside the JSX — best for either/or
<span>{isOnline ? 'Online' : 'Offline'}</span>

// 3. && — best for "show this, or nothing"
{errors.length > 0 && <ErrorList errors={errors} />}

// 4. a variable — best when the condition is long or there are three branches
let status
if (loading) status = <Spinner />
else if (error) status = <Error error={error} />
else status = <Results data={data} />
return <div>{status}</div>`}
        />

        <Example region="ways" column>
          <FourWays />
        </Example>
      </Section>

      <Section title="What renders as nothing">
        <p>
          React skips <code>null</code>, <code>undefined</code>, <code>true</code> and{' '}
          <code>false</code>. Everything else it can render, it renders — including{' '}
          <code>0</code> and the empty string, which is where the trap is.
        </p>

        <Table
          head={['Expression', 'On screen']}
          rows={[
            [<code key="1">{'{null}'}</code>, 'nothing'],
            [<code key="2">{'{undefined}'}</code>, 'nothing'],
            [<code key="3">{'{false}'}</code>, 'nothing'],
            [<code key="4">{'{0}'}</code>, <b key="4b">0</b>],
            [<code key="5">{"{''}"}</code>, 'nothing (but it is a rendered text node)'],
            [<code key="6">{'{NaN}'}</code>, <b key="6b">NaN</b>],
            [<code key="7">{'{[]}'}</code>, 'nothing'],
          ]}
        />
      </Section>

      <Section title="The zero that leaks onto the page">
        <p>
          <code>&&</code> returns its <em>left</em> operand when that operand is falsy. If the
          left operand is <code>0</code>, React happily renders the zero. Empty the box below
          and watch a stray <code>0</code> appear.
        </p>

        <Example region="zero" column>
          <ZeroTrap />
        </Example>

        <Note kind="warn">
          Fix it by making the condition a real boolean: <code>{'{items.length > 0 && …}'}</code>{' '}
          or <code>{'{items.length ? … : null}'}</code>. The same applies to strings —{' '}
          <code>{'{name && <b>{name}</b>}'}</code> renders an empty text node when{' '}
          <code>name</code> is <code>''</code>, which is harmless but will confuse you in the
          inspector.
        </Note>
      </Section>

      <Section title="Returning null">
        <p>
          A component may decide it has nothing to show. Returning <code>null</code> is normal
          and cheap — the component still runs, its hooks still run, it simply renders no DOM.
        </p>

        <Code region="null" />

        <Note>
          Note where the condition lives. Deciding <em>inside</em> the child keeps the parent
          tidy; deciding <em>outside</em> (<code>{'{show && <Alert />}'}</code>) means the child
          is unmounted, and unmounting throws its state away. Which one you want is a real
          design decision, not a style preference.
        </Note>
      </Section>

      <Section title="Same component, different branch, same state">
        <p>
          If both branches of a ternary render the same component type in the same position,
          React reuses the instance and keeps its state — even when it looks like a completely
          different thing on screen. Type in the box, then flip the checkbox.
        </p>

        <Example region="identity" column>
          <BranchIdentity />
        </Example>

        <p>
          The first pair share state because React sees "same type, same slot". The second pair
          are given different <code>key</code>s, which tells React they are different things and
          the old one should be thrown away. That is the general trick for resetting a
          component's state: change its key.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region ways
function FourWays() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('ready')
  const [online, setOnline] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  // 4. a variable, for three-way branching
  let status: ReactNode
  if (state === 'loading') status = <Badge label="status" value="loading…" />
  else if (state === 'error') status = <Badge label="status" value="failed" />
  else status = <Badge label="status" value="ready" tone="hot" />

  return (
    <>
      <div className="card-grid">
        {(['loading', 'error', 'ready'] as const).map((s) => (
          <button key={s} onClick={() => setState(s)} disabled={state === s}>
            {s}
          </button>
        ))}
      </div>

      {status}

      {/* 2. ternary */}
      <Badge label="connection" value={online ? 'Online' : 'Offline'} />
      <button onClick={() => setOnline(!online)}>toggle</button>

      {/* 3. && — nothing at all when the array is empty */}
      {errors.length > 0 && (
        <ul className="plain">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <button onClick={() => setErrors(errors.length ? [] : ['Name is required', 'Email looks wrong'])}>
        {errors.length ? 'clear errors' : 'add errors'}
      </button>
    </>
  )
}
// #endregion

// #region zero
function ZeroTrap() {
  const [text, setText] = useState('hello')

  return (
    <>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />

      <div className="mini">
        {/* text.length is 0 when the box is empty, and 0 renders. */}
        broken: {text.length && <b>{text.length} characters</b>}
      </div>

      <div className="mini">
        {/* a real boolean, so nothing renders */}
        fixed: {text.length > 0 && <b>{text.length} characters</b>}
      </div>
    </>
  )
}
// #endregion

// #region null
function Warning({ children, show }: { children: ReactNode; show: boolean }) {
  // Nothing to say — render nothing. The component still ran.
  if (!show) return null
  return <div className="badge hot">{children}</div>
}
// #endregion

// #region identity
function Field({ label }: { label: string }) {
  const [value, setValue] = useState('')
  return (
    <label>
      {label}
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  )
}

function BranchIdentity() {
  const [swapped, setSwapped] = useState(false)

  return (
    <>
      <label>
        <input type="checkbox" checked={swapped} onChange={(e) => setSwapped(e.target.checked)} />
        swap the branch
      </label>

      {/* Same type, same position, no key: React reuses the instance and the
          text you typed stays put. */}
      {swapped ? <Field label="shipping: " /> : <Field label="billing: " />}

      {/* Different keys: React treats them as different components, unmounts
          one and mounts the other, so the text is cleared. */}
      {swapped ? <Field key="s" label="keyed shipping: " /> : <Field key="b" label="keyed billing: " />}

      <Warning show={swapped}>state above is preserved; state below was reset</Warning>
    </>
  )
}
// #endregion
