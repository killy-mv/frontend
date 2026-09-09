import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 16 — Custom hooks
   ========================================================================== */

export default function CustomHooksLesson() {
  return (
    <>
      <Lede>
        Components share <em>markup</em> by composition. Custom hooks are how they share{' '}
        <em>behaviour</em>: a function whose name begins with <code>use</code> and which is
        allowed to call other hooks. There is no new API to learn here — you have been writing
        these already, you just have not moved them into their own function yet.
      </Lede>

      <Section title="Extracting one">
        <p>
          Any time two components contain the same <code>useState</code> plus{' '}
          <code>useEffect</code> pair, the pair is a hook waiting to be named.
        </p>

        <Snippet
          code={`// before — repeated in every component that needs it
const [on, setOn] = useState(false)
const toggle = useCallback(() => setOn(o => !o), [])

// after — one function, used anywhere
function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = useCallback(() => setOn(o => !o), [])
  return [on, toggle, setOn]
}`}
        />

        <Note>
          <strong>Hooks share logic, not state.</strong> Two components calling{' '}
          <code>useToggle()</code> get two entirely separate booleans — the hook body runs
          inside each caller, so each gets its own state cells. If you want them to share a{' '}
          <em>value</em>, that is lifting state up or Context.
        </Note>

        <Example region="toggle" column>
          <ToggleDemo />
        </Example>
      </Section>

      <Section title="Wrapping something external">
        <p>
          This is where custom hooks earn their keep. Each of these owns an effect, a
          subscription and its cleanup, and hands back a plain value. The component that uses
          it does not know an effect exists.
        </p>

        <Example region="storage" column>
          <StorageDemo />
        </Example>

        <Example region="media" column>
          <MediaDemo />
        </Example>
      </Section>

      <Section title="Composing hooks out of hooks">
        <p>
          Hooks call hooks. <code>useDebounced</code> below is built from <code>useState</code>{' '}
          and <code>useEffect</code>, and a search box is built from <code>useDebounced</code>.
          Type quickly and watch the debounced value lag behind, then catch up.
        </p>

        <Example region="debounce" column>
          <DebounceDemo />
        </Example>
      </Section>

      <Section title="The rules of hooks">
        <p>
          Two rules, and they exist for one reason: React identifies your hooks by{' '}
          <strong>call order</strong>, not by name. First <code>useState</code> in this
          component gets cell 1, second gets cell 2, and so on. Anything that changes the order
          between renders hands a component someone else's state.
        </p>

        <ul>
          <li>
            <strong>Only call hooks at the top level.</strong> Never inside a condition, a
            loop, a nested function, or after an early <code>return</code>.
          </li>
          <li>
            <strong>Only call hooks from components or other hooks.</strong> Not from an event
            handler, not from a plain helper function.
          </li>
        </ul>

        <Code region="rules" label="what goes wrong" />

        <p>
          The <code>use</code> prefix is what tells the linter a function is allowed to break
          neither rule. Name it <code>getToggle</code> and{' '}
          <code>eslint-plugin-react-hooks</code> stops checking it — which is a good reason to
          keep the convention even in code nobody else will read.
        </p>
      </Section>

      <Section title="What makes a good one">
        <ul>
          <li>
            <strong>Name it after the concept, not the mechanism.</strong>{' '}
            <code>useChatRoom</code>, <code>useOnlineStatus</code>, <code>useFormField</code> —
            not <code>useEffectOnce</code> or <code>useMount</code>, which are lifecycle
            wrappers dressed up as abstractions.
          </li>
          <li>
            <strong>Return the smallest useful thing.</strong> An array when the caller will
            want to rename (<code>const [on, toggle] = useToggle()</code>), an object when
            there are more than three values.
          </li>
          <li>
            <strong>Do not extract too early.</strong> Two similar components are not
            duplication yet. Wait until you know which parts actually vary.
          </li>
        </ul>
      </Section>
    </>
  )
}

/* ---------- the hooks ------------------------------------------------------ */

// #region toggle
function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = useCallback(() => setOn((o) => !o), [])
  return { on, toggle, setOn }
}

function ToggleDemo() {
  // Two calls, two independent pieces of state.
  const menu = useToggle(false)
  const details = useToggle(true)

  return (
    <>
      <button onClick={menu.toggle}>menu: {menu.on ? 'open' : 'closed'}</button>
      <button onClick={details.toggle}>details: {details.on ? 'shown' : 'hidden'}</button>
      <Badge label="independent" value={`${menu.on} / ${details.on}`} tone="hot" />
    </>
  )
}
// #endregion

// #region storage
function useLocalStorage(key: string, initial: string) {
  // The lazy initialiser means localStorage is read once, not every render.
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) ?? initial
    } catch {
      return initial // private browsing, quota, disabled storage
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Nothing useful to do; the app keeps working without persistence.
    }
  }, [key, value])

  return [value, setValue] as const
}

function StorageDemo() {
  const [name, setName] = useLocalStorage('react-by-example:name', '')

  return (
    <>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="type, then reload the page"
      />
      <Badge label="persisted as" value={name || '(empty)'} tone="hot" />
      <span style={{ fontSize: 13, color: '#5a6b7c' }}>
        survives a real reload — the one thing the SPA lesson said resets everything
      </span>
    </>
  )
}
// #endregion

// #region media
function useMediaQuery(query: string) {
  const list = useMemo(() => window.matchMedia(query), [query])

  // useState + useEffect would work, but it has to set state inside the effect
  // to catch up whenever `query` changes — a render with the wrong answer,
  // then a second render with the right one. useSyncExternalStore reads the
  // real value during the first render instead. It is the same hook the router
  // in lib/router.ts uses to read the URL.
  return useSyncExternalStore(
    (onChange) => {
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => list.matches,
  )
}

function MediaDemo() {
  const isWide = useMediaQuery('(min-width: 900px)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <>
      <Badge label="min-width: 900px" value={String(isWide)} tone="hot" />
      <Badge label="prefers dark" value={String(prefersDark)} />
      <span style={{ fontSize: 13, color: '#5a6b7c' }}>resize the window</span>
    </>
  )
}
// #endregion

// #region debounce
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    // The cleanup cancels the pending timer, so only the last value in a
    // burst of changes ever lands. That is the whole trick.
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function DebounceDemo() {
  const [text, setText] = useState('')
  const debounced = useDebounced(text, 500)

  return (
    <>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="type quickly"
      />
      <Badge label="live" value={text || '(empty)'} />
      <Badge label="debounced 500ms" value={debounced || '(empty)'} tone="hot" />
    </>
  )
}
// #endregion

// #region rules
// ❌ conditional: on renders where `id` is missing this component calls two
//    hooks instead of three, and every hook after it reads the wrong cell.
//
//   function Profile({ id }) {
//     if (!id) return <Empty />          // early return before a hook
//     const [user, setUser] = useState() // sometimes the 1st hook, sometimes not
//   }
//
// ✅ hooks first, decisions after:
//
//   function Profile({ id }) {
//     const [user, setUser] = useState()
//     if (!id) return <Empty />
//   }
//
// ❌ inside a loop or a handler — same problem, different disguise:
//
//   items.forEach(item => { const [x] = useState(item) })
//   function handleClick() { const theme = useContext(ThemeContext) }
//
// ✅ read the context at the top and use the value in the handler:
//
//   const theme = useContext(ThemeContext)
//   function handleClick() { console.log(theme) }
// #endregion
