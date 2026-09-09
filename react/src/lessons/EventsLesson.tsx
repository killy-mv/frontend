import type { MouseEvent } from 'react'
import { useState } from 'react'
import { useLog } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Out, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 7 — Events
   ========================================================================== */

export default function EventsLesson() {
  return (
    <>
      <Lede>
        An event handler in React is a prop whose value is a function. There are no{' '}
        <code>addEventListener</code> calls in application code and no strings in{' '}
        <code>onclick</code> attributes: you hand React a function and it does the wiring, and
        the unwiring, for you.
      </Lede>

      <Section title="Pass the function, do not call it">
        <p>
          This is the most common first-week mistake in React, and the symptom is memorable:
          the handler fires during render instead of on click, usually forever.
        </p>

        <Snippet
          code={`<button onClick={handleClick}>       ✅ pass a function
<button onClick={() => save(id)}>    ✅ pass a function that calls yours
<button onClick={handleClick()}>     ❌ calls it now, passes the return value
<button onClick={save(id)}>          ❌ same — and if save sets state, infinite loop`}
        />

        <p>
          The inline arrow is the normal way to pass arguments. It creates a new function on
          every render, which is fine — see the Memoisation lesson for the rare case where it
          is not.
        </p>

        <Example region="passing" column>
          <Passing />
        </Example>
      </Section>

      <Section title="The event object">
        <p>
          Handlers receive a React <em>synthetic event</em>: a thin wrapper that normalises
          browser differences and exposes the same API you already know. The real DOM event is
          on <code>e.nativeEvent</code> if you need it.
        </p>

        <Table
          head={['Property', 'What it gives you']}
          rows={[
            [<code key="1">e.target</code>, 'The element the event started on — the thing clicked'],
            [<code key="2">e.currentTarget</code>, 'The element whose handler is running — where you attached it'],
            [<code key="3">e.preventDefault()</code>, 'Stop the browser default: form submit, link navigation'],
            [<code key="4">e.stopPropagation()</code>, 'Stop the event travelling further up the tree'],
            [<code key="5">e.key</code>, 'On keyboard events: "Enter", "Escape", "a"…'],
          ]}
        />

        <Example region="event-object" column>
          <EventObject />
        </Example>
      </Section>

      <Section title="Events bubble">
        <p>
          A click on the inner box also runs the outer box's handler, then the page's. Click
          each ring below and read the order. Tick "stop propagation" and the inner handler
          cuts the chain.
        </p>

        <Example region="bubbling" column>
          <Bubbling />
        </Example>

        <Note>
          Bubbling is a feature far more often than a nuisance: it is how one handler on a list
          can serve every row. Reach for <code>stopPropagation</code> only when an inner
          control genuinely must not trigger the thing around it — a delete button inside a
          clickable card, for instance.
        </Note>
      </Section>

      <Section title="Handlers as props, and what to call them">
        <p>
          A child that should do something on click does not decide <em>what</em>. It takes a
          callback prop. The convention is <code>onSomething</code> for the prop and{' '}
          <code>handleSomething</code> for the function passed in — named after the intention,
          not the input device.
        </p>

        <Code region="naming" label="convention" />

        <p>
          <code>onDelete</code> survives the day someone replaces the button with a swipe
          gesture. <code>onButtonClick</code> does not.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region passing
function Passing() {
  const { lines, log, clear } = useLog()

  function greet() {
    log('greet() ran')
  }

  function greetPerson(name: string) {
    log(`greetPerson("${name}") ran`)
  }

  return (
    <>
      {/* the function itself */}
      <button onClick={greet}>onClick={'{greet}'}</button>

      {/* an arrow that calls it with an argument */}
      <button onClick={() => greetPerson('Ada')}>onClick={"{() => greetPerson('Ada')}"}</button>

      {/* React also passes the event, so this works: */}
      <button onClick={(e) => log('clicked', (e.target as HTMLButtonElement).textContent)}>
        log my own text
      </button>

      <button onClick={clear}>clear</button>
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region event-object
function EventObject() {
  const [last, setLast] = useState('—')

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    setLast(
      `target: <${target.tagName.toLowerCase()}>  ·  currentTarget: <${e.currentTarget.tagName.toLowerCase()}>  ·  at ${e.clientX},${e.clientY}`,
    )
  }

  return (
    <>
      <div className="mini" onClick={handleClick} style={{ cursor: 'pointer' }}>
        Click the <b>bold bit</b> or the plain bit — the handler is on the div either way.
      </div>
      <Badge label="last event" value={last} />

      <label>
        <input
          type="text"
          placeholder="press Enter or Escape"
          onKeyDown={(e) => setLast(`key: ${e.key}`)}
        />
      </label>

      <a
        href="https://react.dev"
        onClick={(e) => {
          // Without this the browser leaves the page.
          e.preventDefault()
          setLast('preventDefault() — navigation cancelled')
        }}
      >
        a link that does not navigate
      </a>
    </>
  )
}
// #endregion

// #region bubbling
function Bubbling() {
  const { lines, log, clear } = useLog()
  const [stop, setStop] = useState(false)

  return (
    <>
      <div
        className="mini"
        onClick={() => log('outer div')}
        style={{ padding: 20, cursor: 'pointer' }}
      >
        outer
        <div
          className="mini"
          onClick={() => log('middle div')}
          style={{ padding: 16, cursor: 'pointer' }}
        >
          middle
          <button
            onClick={(e) => {
              if (stop) e.stopPropagation()
              log(stop ? 'button (and stopped here)' : 'button')
            }}
          >
            inner button
          </button>
        </div>
      </div>

      <label>
        <input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} />
        stop propagation at the button
      </label>
      <button onClick={clear}>clear</button>
      <Out lines={lines} />
    </>
  )
}
// #endregion

// #region naming
// The child names the *event*, not the implementation:
//
//   function ListRow({ item, onDelete, onSelect }) {
//     return (
//       <li onClick={() => onSelect(item.id)}>
//         {item.name}
//         <button onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}>×</button>
//       </li>
//     )
//   }
//
// The parent names the *handler* and decides what happens:
//
//   function List() {
//     function handleDelete(id) { setItems(items.filter(i => i.id !== id)) }
//     return items.map(item => (
//       <ListRow key={item.id} item={item} onDelete={handleDelete} onSelect={setSelected} />
//     ))
//   }
// #endregion
