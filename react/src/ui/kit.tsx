/* ==========================================================================
   The pieces every lesson page is built from.
   --------------------------------------------------------------------------
   This file is worth reading as a lesson in itself: it is a set of small,
   presentational components that take props and return JSX, which is what the
   overwhelming majority of React code looks like.
   ========================================================================== */

import type { ReactNode } from 'react'
import { tokenize } from '../lib/highlight'
import { region } from '../lib/regions'
import { useSource } from '../lib/hooks'

/* ---------- prose --------------------------------------------------------- */

export function Lede({ children }: { children: ReactNode }) {
  return <p className="lede">{children}</p>
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{title}</h2>
      {children}
    </section>
  )
}

export function Note({ kind, children }: { kind?: 'warn'; children: ReactNode }) {
  return <div className={kind ? `note ${kind}` : 'note'}>{children}</div>
}

/* ---------- code ---------------------------------------------------------- */

/** The dark code panel. Highlighting is a regex, not a parser — lib/highlight.ts. */
export function Snippet({ code, label }: { code: string; label?: string }) {
  return (
    <div className="example">
      {label && <div className="example-label">{label}</div>}
      <pre className="code">
        <code>
          {tokenize(code).map((t, i) =>
            t.cls ? (
              <span key={i} className={t.cls}>
                {t.text}
              </span>
            ) : (
              t.text
            ),
          )}
        </code>
      </pre>
    </div>
  )
}

/**
 * Prints a `// #region` block from the lesson's own file.
 *
 * The lesson never passes its source down by hand — `useSource()` reads it from
 * context, which the page chrome put there. See the Context lesson.
 */
export function Code({ region: name, label }: { region: string; label?: string }) {
  const raw = useSource()
  return <Snippet code={region(raw, name)} label={label} />
}

/** A live, interactive area. Whatever is inside is really running. */
export function Stage({ children, column }: { children: ReactNode; column?: boolean }) {
  return <div className={column ? 'stage column' : 'stage'}>{children}</div>
}

/**
 * The standard pairing: the component running, and directly beneath it the
 * source it was built from.
 */
export function Example({
  region: name,
  column,
  children,
}: {
  region: string
  column?: boolean
  children: ReactNode
}) {
  return (
    <div className="attach">
      <Stage column={column}>{children}</Stage>
      <Code region={name} />
    </div>
  )
}

/* ---------- readouts ------------------------------------------------------ */

/** A labelled value, for showing state and render counts inside a Stage. */
export function Badge({ label, value, tone }: { label: string; value: ReactNode; tone?: 'hot' }) {
  return (
    <span className={tone ? `badge ${tone}` : 'badge'}>
      <small>{label}</small>
      {value}
    </span>
  )
}

/** The output panel, styled to match the JavaScript lessons next door. */
export function Out({ lines }: { lines: string[] }) {
  if (!lines.length) return null
  return <pre className="out">{lines.join('\n')}</pre>
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="ref">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
