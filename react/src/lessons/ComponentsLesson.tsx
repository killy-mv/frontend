/* eslint-disable react-hooks/static-components --
   NestedComponentBug defines a component inside another component on purpose,
   to show what happens. `react-hooks/static-components` is the rule that would
   have stopped you writing that bug in the first place. */

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useRenderCount } from '../lib/hooks'
import { Badge, Code, Example, Lede, Note, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 3 — Components
   ========================================================================== */

export default function ComponentsLesson() {
  return (
    <>
      <Lede>
        A component is a JavaScript function that takes an object of inputs and returns a
        description of some UI. That is the entire definition. Everything else — composition,
        reuse, state, the whole framework — is built on functions calling functions.
      </Lede>

      <Section title="The smallest possible one">
        <Snippet
          code={`function Hello() {
  return <p>Hello</p>
}`}
        />

        <p>Two rules, and both are enforced by tooling rather than convention:</p>
        <ul>
          <li>
            <strong>Capitalised name.</strong> JSX compiles <code>&lt;Hello /&gt;</code> to the
            variable <code>Hello</code> but <code>&lt;hello /&gt;</code> to the string{' '}
            <code>'hello'</code>. Lowercase means "HTML tag".
          </li>
          <li>
            <strong>Return something renderable.</strong> JSX, a string, a number, an array,
            or <code>null</code> for "render nothing".
          </li>
        </ul>
      </Section>

      <Section title="Composition is the whole design">
        <p>
          You do not extend components or inherit from them. You put small ones inside bigger
          ones. The tree below is four components deep and none of them knows anything about
          the others beyond the props it is handed.
        </p>

        <Example region="composition" column>
          <ProfileCard name="Grace Hopper" role="Rear Admiral" initials="GH" tags={['COBOL', 'Compilers']} />
        </Example>
      </Section>

      <Section title="children — the slot every component gets for free">
        <p>
          Whatever you nest inside a component's tags arrives as the <code>children</code>{' '}
          prop. It lets you write wrappers that do not care what they are wrapping, which is
          how layout components, panels and modals are built.
        </p>

        <Example region="children" column>
          <ChildrenDemo />
        </Example>
      </Section>

      <Section title="Each use is an independent instance">
        <p>
          Two <code>&lt;Counter /&gt;</code> tags are two separate pieces of state. React keys
          state to a component's <em>position in the tree</em>, not to the function. Click one
          and watch the other stay put.
        </p>

        <Example region="instances" column>
          <TwoCounters />
        </Example>

        <Note>
          The corollary matters later: if a component moves to a different position in the
          tree, or its position is unmounted, React throws its state away. That is the
          mechanism behind the Lists and Keys lesson.
        </Note>
      </Section>

      <Section title="Never define a component inside another component">
        <p>
          This one is worth meeting on purpose, because the symptom is baffling. The demo has
          two text boxes doing the same job. Type in both, then click the button.
        </p>

        <Example region="nested" column>
          <NestedComponentBug />
        </Example>

        <p>
          The inner one is wiped. Defining <code>Inner</code> inside the parent creates a{' '}
          <em>new function identity</em> on every render, so React sees a different component
          type in that slot, unmounts the old subtree and mounts a fresh one — destroying its
          state and its DOM node. Move the definition to module scope and the bug disappears.
        </p>

        <Code region="nested-fix" label="the fix" />
      </Section>

      <Section title="Components render top-down">
        <p>
          React starts at the root and calls each function it meets, collecting what they
          return, until it has a complete tree of plain objects. Only then does it compare
          that tree to the previous one and touch the DOM. Your function does not draw
          anything; it answers a question.
        </p>

        <Snippet
          code={`App()                    → returns <Layout><Page /></Layout>
  Layout({children})     → returns <div class="page">…{children}…</div>
    Page()               → returns <ProfileCard name="Grace" />
      ProfileCard(props) → returns <div class="mini">…</div>

// React now has a tree of objects. It diffs it against the last one
// and applies the minimum set of DOM operations.`}
        />
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region composition
function Avatar({ initials }: { initials: string }) {
  return <span className="badge hot">{initials}</span>
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>
}

function ProfileCard({
  name,
  role,
  initials,
  tags,
}: {
  name: string
  role: string
  initials: string
  tags: string[]
}) {
  return (
    <div className="mini" style={{ minWidth: 280 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Avatar initials={initials} />
        <div>
          <b>{name}</b>
          <div style={{ fontSize: 13, color: '#5a6b7c' }}>{role}</div>
        </div>
      </div>
      <div className="card-grid" style={{ marginTop: 10 }}>
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </div>
  )
}
// #endregion

// #region children
function Panel({ title, children }: { title: string; children: ReactNode }) {
  // Panel has no idea what is inside it, and does not need to.
  return (
    <div className="mini" style={{ minWidth: 240 }}>
      <b>{title}</b>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  )
}

function ChildrenDemo() {
  return (
    <div className="card-grid">
      <Panel title="Text">Just a string.</Panel>
      <Panel title="Markup">
        <ul className="plain">
          <li>Any JSX</li>
          <li>including lists</li>
        </ul>
      </Panel>
      <Panel title="Another component">
        <Avatar initials="RC" />
      </Panel>
    </div>
  )
}
// #endregion

// #region instances
function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      {label}: {count}
    </button>
  )
}

function TwoCounters() {
  return (
    <>
      <Counter label="left" />
      <Counter label="right" />
    </>
  )
}
// #endregion

// #region nested
function StableInput({ label }: { label: string }) {
  const renders = useRenderCount()
  return (
    <label>
      {label}
      <input type="text" placeholder="type here" />
      <Badge label="renders" value={renders} />
    </label>
  )
}

function NestedComponentBug() {
  const [, force] = useState(0)

  // WRONG: a brand new function every render. React cannot tell it is "the
  // same" component, so it unmounts and remounts the whole subtree.
  function InlineInput({ label }: { label: string }) {
    return (
      <label>
        {label}
        <input type="text" placeholder="type here" />
      </label>
    )
  }

  return (
    <>
      <StableInput label="defined at module scope: " />
      <InlineInput label="defined inside the parent: " />
      <button onClick={() => force((n) => n + 1)}>re-render the parent</button>
    </>
  )
}
// #endregion

// #region nested-fix
// Move it out. Now the function identity is stable across renders, React sees
// the same component type in the same slot, and it keeps the DOM node and its
// state instead of rebuilding them.
//
//   function InlineInput({ label }) { … }   ← module scope
//
//   function Parent() {
//     return <InlineInput label="…" />
//   }
//
// If the inner component genuinely needs something from the parent, pass it as
// a prop. That is what props are for.
// #endregion
