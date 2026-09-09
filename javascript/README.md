# JavaScript by Example

My notes on JavaScript, working through the whole W3Schools syllabus — **138 pages, one
concept per page**, each with runnable examples.

No frameworks, no build step, no dependencies. Vanilla JS, HTML and CSS only.

Open `index.html` and start reading.

## Structure

```
javascript/
  index.html          the hub — every topic, grouped, with a live filter
  assets/
    topics.js         the manifest: 18 groups, 138 topics. The single source of truth.
    lesson.js         the runtime — see below
    lesson.css        one stylesheet for the hub and every lesson
  pages/              138 lesson pages, one file per topic
  tools/check.mjs     static validator
```

Nothing else is generated. Each page is a plain HTML file you can open on its own.

## How the pages work

Every lesson page is the same skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Title — JavaScript by Example</title>
  <link rel="stylesheet" href="../assets/lesson.css">
  <script src="../assets/topics.js"></script>
  <script src="../assets/lesson.js"></script>
</head>
<body data-topic="the-slug">

<h1>Title</h1>
<p class="lede">One paragraph of framing.</p>

<section>
  <h2>A heading</h2>
  <p>Prose.</p>

  <div class="stage"> <!-- optional interactive controls --> </div>

  <script class="run">{
    const { log, $ } = demo();
    // real code — this is what runs, and what you see printed
  }</script>
</section>

</body>
</html>
```

No navigation is written by hand. `lesson.js` reads `data-topic`, looks the page up in
`topics.js`, and builds the topbar, breadcrumb, sidebar, prev/next pager and ←/→ keyboard
navigation.

### Self-printing examples

The core idea: **the code you read is literally the code that ran.** `lesson.js` captures
`document.currentScript`, so after each `<script class="run">` it inserts the script's own
source (syntax highlighted) next to the output that script produced. There is no separate
copy of the code to drift out of date.

`demo()` returns three things:

| | |
|---|---|
| `log(...)` | prints to the output panel, formatted like `console.log`. `log.clear()` empties it. Works from event handlers and timers, long after the script has finished. |
| `$(sel)` | `querySelector`, scoped to the enclosing `<section>` |
| `$$(sel)` | `querySelectorAll`, same scope, as a real array |

An uncaught error is caught by a `window` error handler and printed as a red `⚠` line in the
example's own output panel, rather than disappearing into the console.

### Two conventions that matter

**Every example body is wrapped in a bare block:**

```html
<script class="run">{ … }</script>
```

Classic scripts share one global lexical scope, so a second `const { log } = demo();` on the
same page would throw `Identifier 'log' has already been declared`. The block isolates each
example; `lesson.js` strips the braces again before printing the source.

**Classic scripts, not modules.** ES modules are fetched with CORS rules and will not load
from `file://`. Classic scripts mean every page works by double-clicking it. `modules.html`
documents this trade-off and demonstrates modules via `import()` of a data URL.

Cross-section references use `document.querySelector` rather than `$`, since `$` is scoped
to one `<section>`.

## Running it

Double-click `index.html`. That is the whole setup.

A few pages need a real origin, and say so in a banner at the top when they do:

| Page | Why |
|---|---|
| `storage-api`, `cookies` | storage is keyed by origin; `file://` has none |
| `history-api`, `history` | `pushState` throws a `SecurityError` on `file://` |
| `worker-api` | workers are loaded like scripts; the blob fallback may be blocked |
| `fetch-api` | real network requests are blocked (the demos use `blob:` URLs instead) |
| `geolocation-api` | needs a secure context |

To serve the folder:

```sh
npx serve            # or: python -m http.server
```

## Validating

There is no browser in my environment, so `tools/check.mjs` does what can be checked
statically:

```sh
cd javascript
node tools/check.mjs
```

It verifies that every page is listed in `topics.js` and vice versa, that `data-topic`
matches the filename, that all three assets are linked, that every page has at least one
example, that every example is block-wrapped, that every example body parses (via
`vm.Script`), and that no `$('#id')` reaches outside its own `<section>`. It exits non-zero
on any failure.

```
138 pages written, 0 still to write, 0 error(s)
```

## Adding a page

1. Add `{ s: 'slug', t: 'Title', d: 'one-line blurb' }` to the right group in
   `assets/topics.js`.
2. Create `pages/slug.html` from the skeleton above.
3. `node tools/check.mjs`.

The hub, the sidebar and the pager pick it up automatically.

## The 18 groups

Basics · Strings · Numbers & Math · Arrays · Dates · Control Flow · Collections ·
The Language · Objects in Depth · Functions in Depth · Classes · Asynchronous JS ·
HTML DOM · Browser (BOM) · Web APIs · AJAX & JSON · Versions · Graphics
