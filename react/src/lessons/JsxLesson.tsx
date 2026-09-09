import type { ReactNode } from 'react'
import { createElement, useState } from 'react'
import { Badge, Example, Lede, Note, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 2 — JSX
   ========================================================================== */

export default function JsxLesson() {
  return (
    <>
      <Lede>
        JSX looks like HTML sitting inside JavaScript, which makes people assume it is a
        templating language. It is not. It is syntax for one function call, and the compiler
        rewrites it before the browser ever sees it. Once you can read the rewrite, every
        surprising rule about JSX stops being surprising.
      </Lede>

      <Section title="What the compiler actually does">
        <p>
          Vite hands your <code>.tsx</code> files to a JSX transform. Every tag becomes a call
          that returns a plain object — a description of UI, not UI itself.
        </p>

        <Snippet
          label="you write"
          code={`const greeting = <h1 className="title">Hello, {name}!</h1>`}
        />
        <Snippet
          label="the browser runs (roughly)"
          code={`const greeting = jsx('h1', { className: 'title', children: ['Hello, ', name, '!'] })`}
        />

        <p>
          The two demos below are the same UI written both ways. They render identical DOM,
          because after compilation they <em>are</em> the same code.
        </p>

        <Example region="both" column>
          <BothWays />
        </Example>

        <Note>
          <strong>This is why a component must start with a capital letter.</strong> The
          transform looks at the first character: lowercase <code>&lt;div&gt;</code> compiles
          to the string <code>'div'</code>, capitalised <code>&lt;Card&gt;</code> compiles to
          the variable <code>Card</code>. Rename a component to <code>card</code> and React
          will try to create an unknown HTML element instead.
        </Note>
      </Section>

      <Section title="Curly braces mean “stop reading markup, start reading JavaScript”">
        <p>
          Anything between <code>{'{'}</code> and <code>{'}'}</code> is an ordinary JavaScript
          expression — a variable, a call, a ternary, a <code>.map()</code>. An expression,
          not a statement: you cannot put an <code>if</code> or a <code>for</code> loop there,
          because those do not evaluate to a value.
        </p>

        <Example region="braces" column>
          <Braces />
        </Example>

        <Note kind="warn">
          <strong>Four values render as nothing at all:</strong> <code>null</code>,{' '}
          <code>undefined</code>, <code>true</code> and <code>false</code>. That is what makes{' '}
          <code>{'{isOpen && <Panel />}'}</code> work. Numbers and strings <em>do</em> render,
          which is what makes <code>{'{count && <Panel />}'}</code> print a stray{' '}
          <code>0</code>. The Conditional Rendering lesson has the details.
        </Note>
      </Section>

      <Section title="The attributes that are spelled differently">
        <p>
          JSX attribute names are JavaScript property names, not HTML attribute names. A few
          collide with reserved words and most are camelCase.
        </p>

        <Table
          head={['HTML', 'JSX', 'Why']}
          rows={[
            [<code key="a">class</code>, <code key="b">className</code>, '`class` is a reserved word'],
            [<code key="c">for</code>, <code key="d">htmlFor</code>, '`for` is a reserved word'],
            [<code key="e">onclick</code>, <code key="f">onClick</code>, 'Property names are camelCase'],
            [<code key="g">tabindex</code>, <code key="h">tabIndex</code>, 'Same'],
            [
              <code key="i">style="color: red"</code>,
              <code key="j">{'style={{ color: \'red\' }}'}</code>,
              'An object, not a string — hence the double braces',
            ],
            [<code key="k">&lt;br&gt;</code>, <code key="l">&lt;br /&gt;</code>, 'Every tag must be closed'],
          ]}
        />

        <Example region="attrs" column>
          <Attributes />
        </Example>
      </Section>

      <Section title="One parent, or a Fragment">
        <p>
          A function returns one value, so JSX must have one root node. When you do not want
          a wrapper <code>&lt;div&gt;</code> in the DOM, use a Fragment — written{' '}
          <code>&lt;&gt;…&lt;/&gt;</code>, or <code>&lt;Fragment key={'{id}'}&gt;</code> when
          you need a key on it.
        </p>

        <Example region="fragment" column>
          <Fragmented />
        </Example>
      </Section>

      <Section title="JSX is a value, so it goes anywhere a value goes">
        <p>
          Variables, arrays, function arguments, props, both branches of a ternary. This is
          the single most useful thing to internalise: there is no special template scope to
          learn, it is all just JavaScript.
        </p>

        <Example region="values" column>
          <JsxAsValue />
        </Example>
      </Section>

      <Section title="Text is escaped for you">
        <p>
          Whatever you interpolate is inserted as text, never parsed as markup. Type a{' '}
          <code>&lt;script&gt;</code> tag into the box below and it will appear on the page as
          characters. That default is the reason cross-site scripting is rare in React apps.
        </p>

        <Example region="escaping" column>
          <Escaping />
        </Example>

        <Note kind="warn">
          The escape hatch is called <code>dangerouslySetInnerHTML</code>, and the name is the
          documentation. If you pass it user input you have re-created the vulnerability React
          just removed for you.
        </Note>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region both
function WrittenInJsx({ name }: { name: string }) {
  return (
    <p className="mini">
      Hello, <b>{name}</b>!
    </p>
  )
}

function WrittenByHand({ name }: { name: string }) {
  // Exactly what the compiler produces for the component above.
  return createElement(
    'p',
    { className: 'mini' },
    'Hello, ',
    createElement('b', null, name),
    '!',
  )
}

function BothWays() {
  const element = <WrittenInJsx name="world" />

  return (
    <>
      <div className="card-grid">
        <WrittenInJsx name="world" />
        <WrittenByHand name="world" />
      </div>

      {/* An element is a plain object. Nothing is rendered until React is
          handed it — you can log it, store it, pass it around. */}
      <pre className="out">{JSON.stringify({ type: 'WrittenInJsx', props: element.props }, null, 2)}</pre>
    </>
  )
}
// #endregion

// #region braces
function Braces() {
  const user = { name: 'Ada', logins: 41 }
  const now = new Date()

  return (
    <div className="mini">
      {/* a variable */}
      <div>Name: {user.name}</div>
      {/* an expression */}
      <div>Next login will be number {user.logins + 1}</div>
      {/* a method call */}
      <div>Loaded at {now.toLocaleTimeString()}</div>
      {/* a ternary, because `if` is a statement and would not compile here */}
      <div>{user.logins > 40 ? 'Regular' : 'New here'}</div>
    </div>
  )
}
// #endregion

// #region attrs
function Attributes() {
  const [on, setOn] = useState(false)

  return (
    <>
      <label htmlFor="jsx-toggle">
        <input
          id="jsx-toggle"
          type="checkbox"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
        />
        htmlFor + onChange + checked
      </label>

      <span
        className="badge"
        style={{ background: on ? '#eaf1fe' : undefined, borderColor: on ? '#2563eb' : undefined }}
      >
        style is an object
      </span>
    </>
  )
}
// #endregion

// #region fragment
// Invalid — two roots, so this does not compile:
//
//   return (
//     <h3>Title</h3>
//     <p>Body</p>
//   )
//
// Valid, and adds no wrapper element to the DOM:
function Fragmented() {
  return (
    <>
      <h3>Title</h3>
      <p>Body</p>
    </>
  )
}
// #endregion

// #region values
function JsxAsValue() {
  // 1. stored in a variable
  const badge = <Badge label="stored" value="in a const" />

  // 2. built by a function, like any other return value
  const chip = (text: string) => <span className="mini">{text}</span>

  // 3. held in an array, then rendered
  const rows = ['first', 'second', 'third'].map((t) => <li key={t}>{t}</li>)

  // 4. passed as a prop — an element inside another element's props
  return (
    <>
      {badge}
      <div className="card-grid">{chip('from a function')}</div>
      <ul className="plain">{rows}</ul>
      <Panel header={<b>an element passed as a prop</b>}>and children in between</Panel>
    </>
  )
}

function Panel({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="mini">
      {header}
      <div>{children}</div>
    </div>
  )
}
// #endregion

// #region escaping
function Escaping() {
  const [text, setText] = useState('<script>alert("hi")</script>')

  return (
    <>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ minWidth: 320 }}
      />
      {/* Interpolated as text. React sets textContent, not innerHTML. */}
      <div className="mini">{text}</div>
    </>
  )
}
// #endregion
