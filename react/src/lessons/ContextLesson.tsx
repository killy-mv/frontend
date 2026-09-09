import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet } from '../ui/kit'

/* ==========================================================================
   Lesson 14 — Context
   ========================================================================== */

export default function ContextLesson() {
  return (
    <>
      <Lede>
        Props go one level at a time. When a value is needed six levels down, every component
        in between has to accept it and pass it on without caring about it — prop drilling.
        Context lets a parent publish a value to its entire subtree, and any descendant read
        it directly, however deep.
      </Lede>

      <Section title="Three moving parts">
        <Snippet
          code={`// 1. create it, outside any component, with a sensible default
const ThemeContext = createContext('light')

// 2. provide a value to a subtree
<ThemeContext value={theme}>
  <Page />
</ThemeContext>

// 3. read it, at any depth, with no props in between
function Button() {
  const theme = useContext(ThemeContext)
}`}
        />

        <Note>
          <strong>React 19 changed step 2.</strong> <code>&lt;ThemeContext value={'{…}'}&gt;</code>{' '}
          replaces <code>&lt;ThemeContext.Provider value={'{…}'}&gt;</code>. The old form still
          works and is what you will see in most tutorials.
        </Note>

        <p>
          The default passed to <code>createContext</code> is used only when a component reads
          the context with no provider above it. It is a real fallback, not a placeholder —
          which makes components usable in isolation, in tests and in Storybook.
        </p>
      </Section>

      <Section title="Drilling, and not drilling">
        <p>
          Both trees below render the same four-level structure. The left one threads{' '}
          <code>theme</code> through every component; the right one publishes it once and reads
          it at the bottom. Look at the middle components in the source: in the context version
          they take no props at all.
        </p>

        <Example region="compare" column>
          <Comparison />
        </Example>
      </Section>

      <Section title="Context plus state is a provider component">
        <p>
          Context on its own only passes a value down. Put <code>useState</code> next to it and
          you have a small feature-wide store: the value <em>and</em> the way to change it,
          available anywhere below.
        </p>

        <Example region="provider" column>
          <ThemeProvider>
            <Toolbar />
          </ThemeProvider>
        </Example>

        <p>
          Two conventions worth copying. Export a <code>useTheme()</code> hook rather than the
          raw context, so consumers cannot forget the provider — and so you can throw a useful
          error when they do. And wrap the value in <code>useMemo</code>, because an object
          literal is a new value on every render, and every consumer re-renders when the
          context value changes.
        </p>

        <Code region="hook" label="the pattern worth copying" />
      </Section>

      <Section title="What context is not">
        <ul>
          <li>
            <strong>Not a performance optimisation.</strong> Every consumer re-renders when the
            value changes, no matter how deep or how many. Splitting one big context into
            several narrow ones is the usual fix.
          </li>
          <li>
            <strong>Not a state manager.</strong> It is a transport. Something still has to own
            the state — <code>useState</code> or <code>useReducer</code> in the provider.
          </li>
          <li>
            <strong>Not the first thing to reach for.</strong> Passing props is explicit and
            easy to follow. Try passing JSX as <code>children</code> first: a lot of drilling
            disappears when the parent composes the tree instead of describing it.
          </li>
        </ul>

        <p>
          Good candidates are things that are genuinely ambient: theme, locale, the current
          user, a routing location, a toast queue. If only one branch needs it, lift state up
          instead.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region compare
const ThemeContext = createContext<'light' | 'dark'>('light')

/* --- drilled: every level has to know about `theme` ------------------------ */

function DrilledLeaf({ theme }: { theme: string }) {
  return <Badge label="drilled leaf" value={theme} />
}
function DrilledMiddle({ theme }: { theme: string }) {
  return <DrilledLeaf theme={theme} /> // uses it for nothing
}
function DrilledTop({ theme }: { theme: string }) {
  return <DrilledMiddle theme={theme} /> // uses it for nothing
}

/* --- context: the middle levels take no props at all ----------------------- */

function ContextLeaf() {
  const theme = useContext(ThemeContext)
  return <Badge label="context leaf" value={theme} tone="hot" />
}
function ContextMiddle() {
  return <ContextLeaf />
}
function ContextTop() {
  return <ContextMiddle />
}

function Comparison() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>toggle theme</button>
      <DrilledTop theme={theme} />
      <ThemeContext value={theme}>
        <ContextTop />
      </ThemeContext>
    </>
  )
}
// #endregion

// #region provider
type ThemeStore = { theme: 'light' | 'dark'; toggle: () => void }

const ThemeStoreContext = createContext<ThemeStore | null>(null)

function useTheme() {
  const store = useContext(ThemeStoreContext)
  // A far better failure than `undefined is not an object` three files away.
  if (!store) throw new Error('useTheme must be used inside a <ThemeProvider>')
  return store
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Without useMemo this object is new on every render of the provider, so
  // every consumer below re-renders even when the theme did not change.
  const value = useMemo<ThemeStore>(
    () => ({ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }),
    [theme],
  )

  return <ThemeStoreContext value={value}>{children}</ThemeStoreContext>
}

function ThemedButton({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      style={
        theme === 'dark'
          ? { background: '#16202b', color: '#dce6f2', borderColor: '#16202b' }
          : undefined
      }
    >
      {children}
    </button>
  )
}

function Toolbar() {
  // Toolbar neither owns the theme nor passes it on. It just composes.
  const { theme } = useTheme()
  return (
    <>
      <ThemedButton>click to toggle — I read the context myself</ThemedButton>
      <Badge label="current" value={theme} tone="hot" />
    </>
  )
}
// #endregion

// #region hook
// Keep all three pieces in one file and export only the last two:
//
//   const ThemeContext = createContext(null)     // not exported
//
//   export function ThemeProvider({ children }) {
//     const [theme, setTheme] = useState('light')
//     const value = useMemo(() => ({ theme, setTheme }), [theme])
//     return <ThemeContext value={value}>{children}</ThemeContext>
//   }
//
//   export function useTheme() {
//     const ctx = useContext(ThemeContext)
//     if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
//     return ctx
//   }
//
// Consumers now import a hook, not a context object. The implementation —
// useState today, useReducer or a subscription tomorrow — stays yours to change.
// #endregion
