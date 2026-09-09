import { useState } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 9 — Lists and keys
   ========================================================================== */

let nextId = 4

export default function ListsLesson() {
  return (
    <>
      <Lede>
        A list of elements is just an array of elements, so rendering data is{' '}
        <code>data.map(…)</code> and nothing more. The one thing React asks in return is a{' '}
        <code>key</code> on each item — and the reason it asks is worth understanding, because
        getting it wrong produces bugs that look like React is broken.
      </Lede>

      <Section title="map, filter, sort — ordinary array methods">
        <Snippet
          code={`const people = [
  { id: 'a', name: 'Ada',   born: 1815 },
  { id: 'g', name: 'Grace', born: 1906 },
]

<ul>
  {people
    .filter(p => p.born > 1800)
    .sort((a, b) => a.born - b.born)
    .map(p => <li key={p.id}>{p.name}</li>)}
</ul>`}
        />

        <p>
          Note <code>.sort()</code> here is fine because <code>filter</code> already returned a
          fresh array. Sorting the state array directly would mutate it — see the State lesson.
        </p>

        <Example region="basic" column>
          <BasicList />
        </Example>
      </Section>

      <Section title="What a key is for">
        <p>
          Between two renders React has an old array of elements and a new one, and it has to
          work out what happened: was an item inserted, removed, moved, or just changed? The
          key is your answer to that question. It is how React matches an element in the new
          list to a DOM node and a state cell in the old one.
        </p>

        <Note>
          Keys need to be <strong>stable</strong> (the same item gets the same key every render),{' '}
          <strong>unique among siblings</strong> (not globally), and <strong>not random</strong>.{' '}
          <code>key={'{Math.random()}'}</code> guarantees every item is destroyed and rebuilt on
          every render. A database id is ideal; a slug or a natural unique field will do.
        </Note>
      </Section>

      <Section title="The index-as-key bug">
        <p>
          Both lists below render the same data. The top one keys by <code>item.id</code>, the
          bottom by array index. Type something into each row's box, then delete the first row.
        </p>

        <Example region="index-key" column>
          <KeyComparison />
        </Example>

        <p>
          The typed text in the index-keyed list slides up one row. Nothing is wrong with your
          data — it is the <em>component state</em> that got misfiled. Row 0 was "Ada"; after
          the delete, row 0 is "Grace", but React sees key <code>0</code> in both lists and
          concludes it is the same row, so it keeps the state and just changes the text.
        </p>

        <Note kind="warn">
          Index keys are safe in exactly one case: the list never reorders, never has items
          inserted or removed anywhere but the end, and the items hold no state or DOM focus.
          If you are sure of all three, use the index. If you are not, you have a bug waiting.
        </Note>
      </Section>

      <Section title="Where the key goes">
        <p>
          On the outermost element produced by the <code>map</code> callback — not inside the
          component. And remember from the Props lesson: <code>key</code> is consumed by React,
          so the child never receives it.
        </p>

        <Code region="placement" />
      </Section>

      <Section title="Nothing to show">
        <p>
          An empty array renders nothing at all, which usually is not what you want the user to
          see. Handle the empty case explicitly; it is the difference between a blank rectangle
          and an interface.
        </p>

        <Example region="empty" column>
          <EmptyState />
        </Example>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region basic
const PEOPLE = [
  { id: 'a', name: 'Ada Lovelace', born: 1815 },
  { id: 'g', name: 'Grace Hopper', born: 1906 },
  { id: 'm', name: 'Margaret Hamilton', born: 1936 },
  { id: 'k', name: 'Katherine Johnson', born: 1918 },
]

function BasicList() {
  const [minYear, setMinYear] = useState(1900)

  const visible = PEOPLE.filter((p) => p.born >= minYear).sort((a, b) => a.born - b.born)

  return (
    <>
      <label>
        born after
        <input
          type="number"
          value={minYear}
          step={10}
          onChange={(e) => setMinYear(Number(e.target.value))}
          style={{ width: 90 }}
        />
      </label>

      <ul className="plain" style={{ width: '100%' }}>
        {visible.map((p) => (
          <li key={p.id}>
            <span style={{ flex: 1 }}>{p.name}</span>
            <Badge label="born" value={p.born} />
          </li>
        ))}
      </ul>

      <Badge label="showing" value={`${visible.length} of ${PEOPLE.length}`} />
    </>
  )
}
// #endregion

// #region index-key
function Row({ name }: { name: string }) {
  // Each row owns a little state. That is what the key controls the fate of.
  const [note, setNote] = useState('')

  return (
    <li>
      <span style={{ width: 150 }}>{name}</span>
      <input
        type="text"
        value={note}
        placeholder="type a note"
        onChange={(e) => setNote(e.target.value)}
      />
    </li>
  )
}

function KeyComparison() {
  const [rows, setRows] = useState([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
    { id: 3, name: 'Margaret' },
  ])

  return (
    <>
      <div>
        <h4>key={'{row.id}'} — correct</h4>
        <ul className="plain">
          {rows.map((row) => (
            <Row key={row.id} name={row.name} />
          ))}
        </ul>
      </div>

      <div>
        <h4>key={'{index}'} — the state follows the position, not the item</h4>
        <ul className="plain">
          {rows.map((row, index) => (
            <Row key={index} name={row.name} />
          ))}
        </ul>
      </div>

      <button onClick={() => setRows(rows.slice(1))} disabled={rows.length === 0}>
        delete the first row
      </button>
      <button onClick={() => setRows([{ id: nextId++, name: 'New' }, ...rows])}>
        insert at the front
      </button>
      <button
        onClick={() =>
          setRows([
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Grace' },
            { id: 3, name: 'Margaret' },
          ])
        }
      >
        reset
      </button>
    </>
  )
}
// #endregion

// #region placement
// Right — the key is on the element the callback returns:
//
//   {items.map(item => <Row key={item.id} item={item} />)}
//
// Wrong — inside the component, where React never sees it:
//
//   function Row({ item }) {
//     return <li key={item.id}>{item.name}</li>   // useless here
//   }
//
// When each item needs several sibling elements, key the Fragment:
//
//   {items.map(item => (
//     <Fragment key={item.id}>
//       <dt>{item.term}</dt>
//       <dd>{item.definition}</dd>
//     </Fragment>
//   ))}
//
// The <>…</> shorthand cannot take a key, so this is the one place you import
// Fragment by name.
// #endregion

// #region empty
function EmptyState() {
  const [items, setItems] = useState<string[]>([])

  return (
    <>
      {items.length === 0 ? (
        <div className="mini">Nothing here yet. Add something.</div>
      ) : (
        <ul className="plain">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}

      <button onClick={() => setItems([...items, `item ${items.length + 1}`])}>add</button>
      <button onClick={() => setItems([])} disabled={items.length === 0}>
        empty it
      </button>
    </>
  )
}
// #endregion
