import { useReducer, useState } from 'react'
import { Badge, Code, Example, Lede, Note, Section, Snippet, Table } from '../ui/kit'

/* ==========================================================================
   Lesson 15 — Reducer
   ========================================================================== */

export default function ReducerLesson() {
  return (
    <>
      <Lede>
        <code>useReducer</code> is <code>useState</code> with the update logic moved out of the
        event handlers and into one function. Handlers stop describing <em>how</em> state
        changes and start describing <em>what happened</em>. For anything with several related
        fields and several ways to change them, that is a large readability win and a testable
        function for free.
      </Lede>

      <Section title="The shape">
        <Snippet
          code={`// 1. a reducer: (current state, action) => next state. A pure function.
function reducer(state, action) {
  switch (action.type) {
    case 'incremented': return { count: state.count + 1 }
    case 'reset':       return { count: 0 }
    default:            throw new Error('unknown action: ' + action.type)
  }
}

// 2. the hook, given the reducer and the initial state
const [state, dispatch] = useReducer(reducer, { count: 0 })

// 3. handlers send actions; they contain no logic
<button onClick={() => dispatch({ type: 'incremented' })}>+1</button>`}
        />

        <p>
          <code>dispatch</code> behaves exactly like a state setter: it queues an update and
          schedules a render. Its identity is stable for the life of the component, so it never
          needs to be in a dependency array.
        </p>

        <Example region="counter" column>
          <CounterReducer />
        </Example>
      </Section>

      <Section title="The same feature, both ways">
        <p>
          A small task list. First with <code>useState</code>, where every handler has to
          remember how to copy an array immutably; then with <code>useReducer</code>, where all
          of that lives in one place and the handlers are one line each.
        </p>

        <Example region="tasks" column>
          <Tasks />
        </Example>

        <p>
          The reducer version is a few lines longer and considerably easier to change. Adding
          "clear completed" means one <code>case</code>, not a new handler with its own copy of
          the immutability rules. And the reducer is a plain function — you can test it without
          rendering anything at all.
        </p>

        <Code region="test" label="testable in isolation" />
      </Section>

      <Section title="Rules for the reducer">
        <ul>
          <li>
            <strong>It must be pure.</strong> Same state and action in, same state out. No
            fetching, no timers, no <code>Math.random()</code>, no mutation. StrictMode calls
            it twice in development to catch exactly this.
          </li>
          <li>
            <strong>Return new objects, never edit the old one.</strong> The same rule as
            state, for the same reason.
          </li>
          <li>
            <strong>One action, one user intention.</strong> <code>added_task</code>, not{' '}
            <code>set_tasks</code>. If your actions are all "set X", a reducer is buying you
            nothing.
          </li>
        </ul>
      </Section>

      <Section title="Which one to use">
        <Table
          head={['', 'useState', 'useReducer']}
          rows={[
            ['Best for', 'One independent value', 'Several fields that change together'],
            ['Update logic lives', 'In each event handler', 'In one function, outside the component'],
            ['Debugging', 'Search the handlers', 'Log every action in one place'],
            ['Testing', 'Needs a render', 'Call the function'],
            ['Cost', 'None', 'Indirection — worth it only when there is enough logic'],
          ]}
        />

        <Note>
          Start with <code>useState</code>. Move to <code>useReducer</code> when you notice the
          same state being updated from four handlers, or one update having to change three
          fields at once to stay consistent. Combined with Context, a reducer is a perfectly
          respectable app-wide store — which is roughly what Redux is, minus the package.
        </Note>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region counter
type CounterAction = { type: 'incremented' } | { type: 'decremented' } | { type: 'reset' }

function counterReducer(state: { count: number }, action: CounterAction) {
  switch (action.type) {
    case 'incremented':
      return { count: state.count + 1 }
    case 'decremented':
      return { count: state.count - 1 }
    case 'reset':
      return { count: 0 }
  }
}

function CounterReducer() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 })

  return (
    <>
      <button onClick={() => dispatch({ type: 'decremented' })}>−</button>
      <button onClick={() => dispatch({ type: 'incremented' })}>+</button>
      <button onClick={() => dispatch({ type: 'reset' })}>reset</button>
      <Badge label="count" value={state.count} tone="hot" />
    </>
  )
}
// #endregion

// #region tasks
type Task = { id: number; text: string; done: boolean }

let nextId = 3
const INITIAL: Task[] = [
  { id: 1, text: 'Read the JSX lesson', done: true },
  { id: 2, text: 'Break something on purpose', done: false },
]

/* --- with useState: the how is spread across the handlers ------------------ */

function TasksWithState() {
  const [tasks, setTasks] = useState(INITIAL)
  const [draft, setDraft] = useState('')

  function add() {
    if (!draft.trim()) return
    setTasks([...tasks, { id: nextId++, text: draft, done: false }])
    setDraft('')
  }
  function toggle(id: number) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }
  function remove(id: number) {
    setTasks(tasks.filter((t) => t.id !== id))
  }

  return <TaskList tasks={tasks} draft={draft} onDraft={setDraft} onAdd={add} onToggle={toggle} onRemove={remove} />
}

/* --- with useReducer: the how is in one pure function ---------------------- */

type TaskAction =
  | { type: 'added'; text: string }
  | { type: 'toggled'; id: number }
  | { type: 'deleted'; id: number }
  | { type: 'cleared_completed' }

function tasksReducer(tasks: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'added':
      return [...tasks, { id: nextId++, text: action.text, done: false }]
    case 'toggled':
      return tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    case 'deleted':
      return tasks.filter((t) => t.id !== action.id)
    case 'cleared_completed':
      return tasks.filter((t) => !t.done)
  }
}

function TasksWithReducer() {
  const [tasks, dispatch] = useReducer(tasksReducer, INITIAL)
  const [draft, setDraft] = useState('')

  // Every handler is now one line, and says what happened rather than how.
  return (
    <>
      <TaskList
        tasks={tasks}
        draft={draft}
        onDraft={setDraft}
        onAdd={() => {
          if (!draft.trim()) return
          dispatch({ type: 'added', text: draft })
          setDraft('')
        }}
        onToggle={(id) => dispatch({ type: 'toggled', id })}
        onRemove={(id) => dispatch({ type: 'deleted', id })}
      />
      <button onClick={() => dispatch({ type: 'cleared_completed' })}>
        clear completed — one new case
      </button>
    </>
  )
}

function TaskList({
  tasks,
  draft,
  onDraft,
  onAdd,
  onToggle,
  onRemove,
}: {
  tasks: Task[]
  draft: string
  onDraft: (s: string) => void
  onAdd: () => void
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}) {
  return (
    <>
      <ul className="plain" style={{ width: '100%' }}>
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} />
            <span style={{ flex: 1 }}>{t.text}</span>
            <button onClick={() => onRemove(t.id)}>×</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        placeholder="new task, Enter to add"
      />
      <button onClick={onAdd}>add</button>
    </>
  )
}

function Tasks() {
  return (
    <>
      <div style={{ width: '100%' }}>
        <h4>useState</h4>
        <TasksWithState />
      </div>
      <div style={{ width: '100%' }}>
        <h4>useReducer</h4>
        <TasksWithReducer />
      </div>
    </>
  )
}
// #endregion

// #region test
// No component, no DOM, no test renderer — the reducer is a function:
//
//   test('toggling flips done', () => {
//     const before = [{ id: 1, text: 'a', done: false }]
//     const after  = tasksReducer(before, { type: 'toggled', id: 1 })
//
//     expect(after[0].done).toBe(true)
//     expect(before[0].done).toBe(false)   // and the input was not mutated
//   })
//
// See ../vitest for the runner this repo uses.
// #endregion
