import { useEffect, useState } from 'react'
import { BOOT_AT, BOOT_ID, navigationCount, uptimeSeconds } from '../lib/boot'
import { Badge, Example, Lede, Note, Section, Snippet, Stage, Table } from '../ui/kit'
import indexHtml from '../../index.html?raw'

/* ==========================================================================
   Lesson 1 — Single Page App
   ========================================================================== */

export default function SpaLesson() {
  return (
    <>
      <Lede>
        The server sends this site's HTML file <strong>once</strong>. It contains one empty{' '}
        <code>&lt;div id="root"&gt;</code> and one <code>&lt;script&gt;</code> tag. Everything
        after that — every lesson, every button, this sentence — is DOM that React created
        and is still managing. That is what "single page application" means, and this page
        is the proof.
      </Lede>

      <Section title="The entire HTML the server sends">
        <p>
          Not a summary of it — the actual file, imported as text so it cannot fall out of
          date. There is no content in it. If you disable JavaScript you get a blank white
          page, which is the trade a SPA makes.
        </p>

        <Snippet code={indexHtml.trim()} label="react/index.html" />

        <p>
          Vite rewrites that <code>&lt;script&gt;</code> when you build: in development it
          points at <code>/src/main.tsx</code> and the browser is handed modules one by one;
          in <code>npm run build</code> output it points at a hashed, bundled{' '}
          <code>/assets/index-XXXX.js</code>. Either way it is one script and one div.
        </p>
      </Section>

      <Section title="Three lines hand the page to React">
        <p>
          <code>src/main.tsx</code> is the only place in the whole app that touches the DOM
          by hand. It finds the root node, creates a React root from it, and renders the
          top-level component into it. After that React owns every node underneath.
        </p>

        <Snippet
          label="src/main.tsx (the part that matters)"
          code={`const root = document.getElementById('root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`}
        />

        <Note>
          <strong>Read <code>&lt;App /&gt;</code> as a value, not a call.</strong> It compiles
          to <code>createElement(App)</code>, which produces a plain object describing what
          you want. <code>render</code> takes that description and decides which DOM nodes to
          create. You never say <code>appendChild</code>.
        </Note>
      </Section>

      <Section title="Look at the real root node">
        <p>
          This component reads <code>document.getElementById('root')</code> — the same node
          from the HTML above — and reports what is inside it right now. The children it
          counts are React's work.
        </p>

        <Example region="inspector" column>
          <RootInspector />
        </Example>
      </Section>

      <Section title="Navigating never reloads">
        <p>
          These three numbers live in module scope in <code>src/lib/boot.ts</code>, which runs
          exactly once per real page load. Click through a few lessons in the sidebar and come
          back: the id and the boot time will be unchanged and the uptime will have grown. Now
          press <kbd>F5</kbd> — all three reset. That difference is the whole idea.
        </p>

        <Stage column>
          <BootPanel />
        </Stage>

        <Snippet
          label="src/lib/boot.ts"
          code={`// Module scope: runs once, when the browser first evaluates the bundle.
export const BOOT_ID = Math.random().toString(36).slice(2, 8).toUpperCase()
export const BOOT_AT = new Date()`}
        />
      </Section>

      <Section title="The router is forty lines">
        <p>
          Something has to turn <code>#/spa</code> into "render <code>SpaLesson</code>". In
          this app that is <code>src/lib/router.ts</code>, and there is no dependency involved
          — a URL is a string and a component is a value, so routing is a lookup.
        </p>

        <Snippet
          label="src/lib/router.ts"
          code={`function subscribe(onChange) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function read() {
  return window.location.hash.replace(/^#\\/?/, '')
}

export function useRoute() {
  return useSyncExternalStore(subscribe, read)
}`}
        />

        <p>
          <code>useSyncExternalStore</code> is React's supported way to read a value that
          lives outside React. You give it a subscribe function and a read function; it
          re-renders the component when the value changes. <code>src/App.tsx</code> then does
          the lookup:
        </p>

        <Snippet
          label="src/App.tsx"
          code={`const slug = useRoute()          // "spa"
const match = findLesson(slug)   // { lesson, prev, next, … }

return <match.lesson.C />        // render that lesson's component`}
        />

        <p>Here is the same idea, small enough to see all at once:</p>

        <Example region="tabs" column>
          <MiniRouter />
        </Example>
      </Section>

      <Section title="What you traded away">
        <p>
          A SPA is a choice with costs, and it is worth naming them while learning rather than
          discovering them in production.
        </p>

        <Table
          head={['', 'Multi-page (server-rendered)', 'Single page (this app)']}
          rows={[
            ['First paint', 'HTML arrives with content in it', 'Blank until the JS bundle parses and runs'],
            ['Navigation', 'Full round trip, everything re-parsed', 'A component swap; state survives'],
            ['State', 'Lost on every link click', 'Lives in memory across routes'],
            ['No JavaScript', 'Still works', 'Blank page'],
            ['Hosting', 'Any web server', 'Needs a rewrite rule so deep links reach index.html'],
            ['SEO / social previews', 'Free', 'Needs pre-rendering or SSR'],
          ]}
        />

        <Note kind="warn">
          <strong>The hash is not a detail.</strong> This app routes on <code>#/spa</code>{' '}
          rather than <code>/spa</code> so the built output runs from any static host with no
          configuration. Real apps use the History API and need the server to answer{' '}
          <em>every</em> path with <code>index.html</code>. Forgetting that is the classic
          "works in dev, 404 in production" bug. See <code>../hosting</code> for the same
          problem from the server's side.
        </Note>

        <p>
          Frameworks like Next.js (<code>../next-js</code>) exist mostly to buy back the first
          two rows without giving up the third.
        </p>
      </Section>
    </>
  )
}

/* ---------- demos ---------------------------------------------------------- */

// #region inspector
function readRoot() {
  const root = document.getElementById('root')
  return {
    tag: root ? `<${root.tagName.toLowerCase()} id="${root.id}">` : 'missing',
    children: root?.children.length ?? 0,
    descendants: root?.querySelectorAll('*').length ?? 0,
    bodyChildren: document.body.children.length,
  }
}

function RootInspector() {
  const [info, setInfo] = useState(readRoot)

  // Reading the DOM is a side effect, so it happens in an effect — never during
  // render. The interval keeps the numbers honest as you interact with the page.
  useEffect(() => {
    const id = setInterval(() => setInfo(readRoot()), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Badge label="root node" value={info.tag} />
      <Badge label="direct children" value={info.children} />
      <Badge label="descendants React made" value={info.descendants} tone="hot" />
      <Badge label="children of <body>" value={info.bodyChildren} />
    </>
  )
}
// #endregion

function BootPanel() {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Badge label="boot id" value={BOOT_ID} tone="hot" />
      <Badge label="page loaded at" value={BOOT_AT.toLocaleTimeString()} />
      <Badge label="seconds since load" value={uptimeSeconds()} />
      <Badge label="route changes since load" value={navigationCount()} />
    </>
  )
}

// #region tabs
const PAGES = {
  home: 'You are on Home. Nothing was fetched to get here.',
  about: 'You are on About. Same DOM, different subtree.',
  contact: 'You are on Contact. The counter below still remembers.',
}

function MiniRouter() {
  const [page, setPage] = useState<keyof typeof PAGES>('home')
  const [clicks, setClicks] = useState(0)

  return (
    <>
      <div>
        {(Object.keys(PAGES) as Array<keyof typeof PAGES>).map((name) => (
          <button
            key={name}
            onClick={() => setPage(name)}
            disabled={page === name}
            style={{ marginRight: 6 }}
          >
            {name}
          </button>
        ))}
      </div>

      <p style={{ margin: 0 }}>{PAGES[page]}</p>

      <button onClick={() => setClicks((c) => c + 1)}>
        clicked {clicks} times — survives every "navigation"
      </button>
    </>
  )
}
// #endregion
