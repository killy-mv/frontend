/* ==========================================================================
   The syllabus. One entry = one page of the app.
   Order here is the order of the sidebar and of the prev/next arrows.

   Each entry carries two imports of the same file:
     C   — the compiled component, which is what gets rendered
     raw — the file's own text, which is what gets printed as example code
   Vite's `?raw` suffix is what makes the second one possible; see lib/regions.ts.
   ========================================================================== */

import type { ComponentType } from 'react'

import Spa from './lessons/SpaLesson'
import spaRaw from './lessons/SpaLesson.tsx?raw'
import Jsx from './lessons/JsxLesson'
import jsxRaw from './lessons/JsxLesson.tsx?raw'
import Components from './lessons/ComponentsLesson'
import componentsRaw from './lessons/ComponentsLesson.tsx?raw'
import Props from './lessons/PropsLesson'
import propsRaw from './lessons/PropsLesson.tsx?raw'

import State from './lessons/StateLesson'
import stateRaw from './lessons/StateLesson.tsx?raw'
import Snapshot from './lessons/SnapshotLesson'
import snapshotRaw from './lessons/SnapshotLesson.tsx?raw'
import Events from './lessons/EventsLesson'
import eventsRaw from './lessons/EventsLesson.tsx?raw'
import Conditional from './lessons/ConditionalLesson'
import conditionalRaw from './lessons/ConditionalLesson.tsx?raw'
import Lists from './lessons/ListsLesson'
import listsRaw from './lessons/ListsLesson.tsx?raw'
import Forms from './lessons/FormsLesson'
import formsRaw from './lessons/FormsLesson.tsx?raw'
import Lifting from './lessons/LiftingLesson'
import liftingRaw from './lessons/LiftingLesson.tsx?raw'

import Effects from './lessons/EffectsLesson'
import effectsRaw from './lessons/EffectsLesson.tsx?raw'
import Refs from './lessons/RefsLesson'
import refsRaw from './lessons/RefsLesson.tsx?raw'
import Context from './lessons/ContextLesson'
import contextRaw from './lessons/ContextLesson.tsx?raw'
import Reducer from './lessons/ReducerLesson'
import reducerRaw from './lessons/ReducerLesson.tsx?raw'
import CustomHooks from './lessons/CustomHooksLesson'
import customHooksRaw from './lessons/CustomHooksLesson.tsx?raw'
import Memo from './lessons/MemoLesson'
import memoRaw from './lessons/MemoLesson.tsx?raw'
import Fetching from './lessons/FetchingLesson'
import fetchingRaw from './lessons/FetchingLesson.tsx?raw'
import Purity from './lessons/PurityLesson'
import purityRaw from './lessons/PurityLesson.tsx?raw'

export type Lesson = {
  /** slug — the bit after the `#/` in the URL */
  s: string
  /** title */
  t: string
  /** one-line blurb, shown on the hub */
  d: string
  C: ComponentType
  raw: string
}

export type Group = { g: string; items: Lesson[] }

export const SYLLABUS: Group[] = [
  {
    g: 'The shape of a React app',
    items: [
      {
        s: 'spa',
        t: 'Single Page App',
        d: 'One HTML file, one root div, and React rendering everything inside it.',
        C: Spa,
        raw: spaRaw,
      },
      {
        s: 'jsx',
        t: 'JSX',
        d: 'Markup-looking syntax that is really just function calls.',
        C: Jsx,
        raw: jsxRaw,
      },
      {
        s: 'components',
        t: 'Components',
        d: 'Functions that return UI, composed into a tree.',
        C: Components,
        raw: componentsRaw,
      },
      {
        s: 'props',
        t: 'Props',
        d: 'Read-only inputs. Data flows down, events go back up.',
        C: Props,
        raw: propsRaw,
      },
    ],
  },
  {
    g: 'State and interaction',
    items: [
      {
        s: 'state',
        t: 'State',
        d: "A component's memory. Change it and React re-renders.",
        C: State,
        raw: stateRaw,
      },
      {
        s: 'state-snapshot',
        t: 'State as a snapshot',
        d: 'Why setCount(count + 1) three times only adds one.',
        C: Snapshot,
        raw: snapshotRaw,
      },
      {
        s: 'events',
        t: 'Events',
        d: 'Handlers as props, the event object, bubbling and defaults.',
        C: Events,
        raw: eventsRaw,
      },
      {
        s: 'conditional',
        t: 'Conditional rendering',
        d: 'if, ternary, && — and the zero that leaks onto the page.',
        C: Conditional,
        raw: conditionalRaw,
      },
      {
        s: 'lists',
        t: 'Lists and keys',
        d: 'map() over data, and why the key must be stable.',
        C: Lists,
        raw: listsRaw,
      },
      {
        s: 'forms',
        t: 'Forms',
        d: 'Controlled inputs: state is the single source of truth.',
        C: Forms,
        raw: formsRaw,
      },
      {
        s: 'lifting-state',
        t: 'Lifting state up',
        d: 'Two components that need the same value share a parent.',
        C: Lifting,
        raw: liftingRaw,
      },
    ],
  },
  {
    g: 'Escape hatches',
    items: [
      {
        s: 'effects',
        t: 'Effects',
        d: 'Synchronising with the world outside React, and cleaning up after.',
        C: Effects,
        raw: effectsRaw,
      },
      {
        s: 'refs',
        t: 'Refs',
        d: 'A value that survives renders without causing one.',
        C: Refs,
        raw: refsRaw,
      },
      {
        s: 'context',
        t: 'Context',
        d: 'Passing a value to a deep subtree without threading props.',
        C: Context,
        raw: contextRaw,
      },
      {
        s: 'reducer',
        t: 'Reducer',
        d: 'When state changes come in kinds, name them as actions.',
        C: Reducer,
        raw: reducerRaw,
      },
      {
        s: 'custom-hooks',
        t: 'Custom hooks',
        d: 'Extracting stateful logic so it can be reused, not the markup.',
        C: CustomHooks,
        raw: customHooksRaw,
      },
      {
        s: 'memo',
        t: 'Memoisation',
        d: 'memo, useMemo and useCallback — and when they are just noise.',
        C: Memo,
        raw: memoRaw,
      },
      {
        s: 'fetching',
        t: 'Data fetching',
        d: 'Loading states, cleanup, and the race condition everyone hits.',
        C: Fetching,
        raw: fetchingRaw,
      },
    ],
  },
  {
    g: 'The rules',
    items: [
      {
        s: 'purity',
        t: 'Purity and StrictMode',
        d: 'Why your component ran twice, and the rules of hooks.',
        C: Purity,
        raw: purityRaw,
      },
    ],
  },
]

export const FLAT: Lesson[] = SYLLABUS.flatMap((g) => g.items)

export function findLesson(slug: string) {
  const index = FLAT.findIndex((l) => l.s === slug)
  return index === -1
    ? null
    : {
        index,
        lesson: FLAT[index],
        group: SYLLABUS.find((g) => g.items.includes(FLAT[index]))!.g,
        prev: index > 0 ? FLAT[index - 1] : null,
        next: index < FLAT.length - 1 ? FLAT[index + 1] : null,
      }
}
