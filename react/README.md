# React

```
index.html          the only HTML file. One empty <div id="root">.
src/main.tsx        the three lines that hand that div to React
src/App.tsx         the root component: hub, chrome, and the route lookup
src/syllabus.ts     the 19 lessons, in order
src/lessons/        one file per concept
src/lib/            the router, the source extractor, the highlighter
src/ui/kit.tsx      the components every lesson page is built from
```

Nineteen lessons, each with prose, a component that is genuinely running on the
page, and the exact source it was built from printed underneath.

```
npm install
npm run dev        # http://localhost:5173
```

Then read each lesson with its file open beside it — the file *is* the lesson.

## The same shape as ../javascript

The plain-JavaScript notes next door are static pages that print each
`<script>` block's own text next to the output it produced. This folder keeps
that promise, but JSX is compiled, so a component cannot read its own body at
runtime.

Vite's `?raw` import gets it back. `src/syllabus.ts` imports every lesson twice —
once as a component, once as text:

```ts
import State from './lessons/StateLesson'
import stateRaw from './lessons/StateLesson.tsx?raw'
```

The lesson marks the interesting parts with region comments, and `<Code
region="…" />` slices them back out (`src/lib/regions.ts`):

```tsx
// #region broken-vs-state
function BrokenCounter() { … }
// #endregion
```

So the code you read on the page is literally the code running above it. There
is only one copy of it, and it cannot drift.

## The lessons

| # | | |
| --- | --- | --- |
| | **The shape of a React app** | |
| 1 | Single Page App | one HTML file, one root div, React rendering everything |
| 2 | JSX | markup-looking syntax that is really just function calls |
| 3 | Components | functions that return UI, composed into a tree |
| 4 | Props | read-only inputs; data down, events up |
| | **State and interaction** | |
| 5 | State | a component's memory; change it and React re-renders |
| 6 | State as a snapshot | why `setCount(count + 1)` three times only adds one |
| 7 | Events | handlers as props, the event object, bubbling |
| 8 | Conditional rendering | `if`, ternary, `&&` — and the zero that leaks onto the page |
| 9 | Lists and keys | `map()` over data, and why the key must be stable |
| 10 | Forms | controlled inputs: state as the single source of truth |
| 11 | Lifting state up | two components that need the same value share a parent |
| | **Escape hatches** | |
| 12 | Effects | synchronising with the outside world, and cleaning up after |
| 13 | Refs | a value that survives renders without causing one |
| 14 | Context | passing a value to a deep subtree without threading props |
| 15 | Reducer | when state changes come in kinds, name them as actions |
| 16 | Custom hooks | extracting stateful logic so it can be reused |
| 17 | Memoisation | `memo`, `useMemo`, `useCallback` — and when they are noise |
| 18 | Data fetching | loading states, cleanup, and the race condition everyone hits |
| | **The rules** | |
| 19 | Purity and StrictMode | why your component ran twice, and the rules of hooks |

## Deliberately wrong code

Several lessons contain the bug they are describing: a counter in a plain `let`,
a component defined inside another component, an effect whose dependency is
rebuilt every render, a list keyed by index. `eslint-plugin-react-hooks` catches
all of them, so those files carry a file-level `eslint-disable` with a comment
naming the rule and saying why it is switched off.

Reading those headers is a decent summary of the contract on its own:

| Rule | What it stops you doing |
| --- | --- |
| `react-hooks/immutability` | reassigning a variable after render completes |
| `react-hooks/static-components` | defining a component inside another component |
| `react-hooks/globals` | mutating module scope during render |
| `react-hooks/refs` | reading or writing `ref.current` during render |
| `react-hooks/set-state-in-effect` | calling `setState` synchronously in an effect |
| `react-hooks/exhaustive-deps` | leaving something out of a dependency array |

`npm run lint` should be clean. If it is not, the lesson is out of date.

## Two things I got wrong first

**`useRenderCount` counts in twos.** Every render badge on the site climbs by two
per interaction, because `<StrictMode>` renders every component twice in
development to expose impure code. It is not a bug in the counter and it is not
a bug in React. `npm run build && npm run preview` halves every number.

**The router uses the hash on purpose.** `#/state`, not `/state`. The hash never
reaches the server, so `dist/` works from any static host with no rewrite rules.
A real app uses the History API and needs the server to answer *every* path with
`index.html` — which is the "works in dev, 404 in production" bug in one
sentence. See `../hosting`.

## Where this goes next

- `../next-js` — the same components, rendered on a server first
- `../fetch` and `../http` — the request layer lesson 18 stands on
- `../vitest` — testing components and the reducers from lesson 15
- `../typescript` — the prop types used throughout
- `../design-system` — what the `ui/kit.tsx` idea grows into
