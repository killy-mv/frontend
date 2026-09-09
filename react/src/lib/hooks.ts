/* ==========================================================================
   Small hooks shared by the lessons.

   A "hook" is just a function whose name starts with `use` and which is allowed
   to call other hooks. That naming convention is not decoration — the linter and
   the React runtime both rely on it. See the Custom Hooks lesson.
   ========================================================================== */

import { createContext, useCallback, useContext, useRef, useState } from 'react'

/* ---------- the raw source of the lesson currently on screen -------------- */

export const SourceContext = createContext('')

export function useSource() {
  return useContext(SourceContext)
}

/* ---------- render counter ------------------------------------------------ */

/**
 * How many times this component has rendered.
 *
 * Mutating a ref during render is impure and React tells you not to do it —
 * `react-hooks/refs` flags the two lines below, and it is right. This is the one
 * place in the project where the rule is worth breaking, because the number *is*
 * the lesson. Two consequences you will see on the page:
 *
 *   - In development `<StrictMode>` renders every component twice, so the count
 *     climbs in twos. That is intentional; see the Purity lesson.
 *   - The badge always shows the count from the render *before* the one you are
 *     looking at, because it is read and written in the same pass.
 */
export function useRenderCount() {
  const count = useRef(0)
  // eslint-disable-next-line react-hooks/refs -- see above; the impurity is the demo
  count.current += 1
  // eslint-disable-next-line react-hooks/refs -- see above
  return count.current
}

/* ---------- a console.log you can put on the page ------------------------- */

function fmt(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}()`
  if (value instanceof Error) return `${value.name}: ${value.message}`
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

/**
 * Appends lines to a list held in state, so a demo can show what happened in a
 * handler or an effect. Because `log` writes state, it must be called from an
 * event handler or an effect — never during render. Calling it during render
 * would make the component impure and loop forever.
 */
export function useLog() {
  const [lines, setLines] = useState<string[]>([])

  const log = useCallback((...parts: unknown[]) => {
    setLines((prev) => [...prev, parts.map(fmt).join(' ')])
  }, [])

  const clear = useCallback(() => setLines([]), [])

  return { lines, log, clear }
}
