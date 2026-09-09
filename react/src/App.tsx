/* ==========================================================================
   The root component.
   --------------------------------------------------------------------------
   Everything you see on screen is returned from here, or from something here
   renders. There is one <div id="root"> in index.html and React owns all of it.

   Read this file as the worked example for the Single Page App lesson: a route
   comes in as a string, a `switch`-like lookup turns it into a component, and
   React swaps the subtree. No document was fetched, no script re-ran.
   ========================================================================== */

import { useEffect, useState } from 'react'
import { FLAT, SYLLABUS, findLesson } from './syllabus'
import { href, useRoute } from './lib/router'
import { recordNavigation } from './lib/boot'
import { SourceContext } from './lib/hooks'

export default function App() {
  const slug = useRoute()
  const match = slug ? findLesson(slug) : null

  // Every route change is a "navigation" as far as the app is concerned, even
  // though the browser did not load anything. The SPA lesson reads this count.
  useEffect(() => {
    recordNavigation()
    window.scrollTo(0, 0)
  }, [slug])

  if (!slug) return <Hub />
  if (!match) return <NotFound slug={slug} />

  const { lesson, index, group, prev, next } = match

  return (
    <>
      <header className="topbar">
        <a className="brand" href={href('')}>
          React <span>by Example</span>
        </a>
        <span className="crumb">
          {group} › {lesson.t} <b>#{index + 1}</b> of {FLAT.length}
        </span>
        <span className="spacer" />
        <nav className="pager">
          {prev && <a href={href(prev.s)}>← {prev.t}</a>}
          {next && <a href={href(next.s)}>{next.t} →</a>}
        </nav>
      </header>

      <div className="page">
        <Sidebar current={lesson.s} />

        <div className="content">
          <h1>{lesson.t}</h1>

          {/* The lesson's own source text, so <Code region="…" /> anywhere
              inside it can print the code that is really running. */}
          <SourceContext value={lesson.raw}>
            <lesson.C />
          </SourceContext>

          <nav className="pager-foot">
            {prev ? (
              <a className="prev" href={href(prev.s)}>
                <small>Previous</small>
                {prev.t}
              </a>
            ) : (
              <span className="prev ghost" />
            )}
            {next ? (
              <a className="next" href={href(next.s)}>
                <small>Next</small>
                {next.t}
              </a>
            ) : (
              <span className="next ghost" />
            )}
          </nav>
        </div>
      </div>

      <Keyboard prev={prev?.s} next={next?.s} />
    </>
  )
}

/* ---------- the hub ------------------------------------------------------- */

function Hub() {
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()

  const groups = SYLLABUS.map((group) => ({
    ...group,
    items: group.items.filter(
      (i) => !term || `${i.t} ${i.d} ${i.s} ${group.g}`.toLowerCase().includes(term),
    ),
  })).filter((group) => group.items.length > 0)

  const shown = groups.reduce((n, g) => n + g.items.length, 0)
  let n = 0

  return (
    <div className="hub">
      <header className="masthead">
        <h1>
          React <span>by Example</span>
        </h1>
        <p>
          My notes while learning React. Every concept gets its own page: a short
          explanation, a component that is really running on the page, and the exact
          source it was built from printed underneath.
        </p>
        <p className="small">
          The whole site is one React app served by Vite. Clicking a lesson does not load
          a document — watch the browser tab spinner stay still.
        </p>
      </header>

      <div className="filter">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter lessons — try &quot;state&quot;, &quot;hook&quot;, &quot;render&quot;…"
        />
        <span className="count">
          {term ? `${shown} of ${FLAT.length} lessons` : `${FLAT.length} lessons`}
        </span>
      </div>

      <main>
        {groups.map((group) => (
          <section className="group" key={group.g}>
            <h2>{group.g}</h2>
            <div className="cards">
              {group.items.map((item) => (
                <a className="card" key={item.s} href={href(item.s)}>
                  <span className="n">{++n}</span>
                  <b>{item.t}</b>
                  <span className="d">{item.d}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

/* ---------- chrome -------------------------------------------------------- */

function Sidebar({ current }: { current: string }) {
  return (
    <nav className="sidebar">
      {SYLLABUS.map((group) => (
        <details key={group.g} open={group.items.some((i) => i.s === current)}>
          <summary>{group.g}</summary>
          <ol>
            {group.items.map((item) => (
              <li key={item.s}>
                <a className={item.s === current ? 'current' : ''} href={href(item.s)}>
                  {item.t}
                </a>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </nav>
  )
}

/** ← / → move between lessons, exactly like the JavaScript lessons next door. */
function Keyboard({ prev, next }: { prev?: string; next?: string }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.metaKey || e.ctrlKey) return
      if (e.key === 'ArrowLeft' && prev) window.location.hash = href(prev)
      if (e.key === 'ArrowRight' && next) window.location.hash = href(next)
    }
    document.addEventListener('keydown', onKey)
    // Without this the previous lesson's handler would stay subscribed and both
    // would fire. Cleanup is the whole subject of the Effects lesson.
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next])

  return null
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="hub">
      <header className="masthead">
        <h1>No lesson called “{slug}”</h1>
        <p>
          The router looked it up in the syllabus and found nothing. <a href={href('')}>Back
          to the index</a>.
        </p>
      </header>
    </div>
  )
}
