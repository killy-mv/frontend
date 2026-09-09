# HTML

```
elements.html    every element in the living standard, rendered and explained
assets/          the files the embedding demos actually load
```

## elements.html

One page, no build step, no dependencies. Open it in a browser and read it with the
source open beside it — the markup *is* the lesson, which is the reason it is a single
file with the CSS inline rather than a tidy project.

Every entry follows the same shape:

```html
<article class="el" id="el-mark">
  <h3><code>&lt;mark&gt;</code></h3>
  <div class="demo">…the element, actually working…</div>
  <p>…what it does, and when it earns its place.</p>
</article>
```

The eleven groups are the ones the spec itself uses: document skeleton, content
sectioning, text blocks, inline semantics, edits, embedded content, tables, forms,
interactive, scripting, and a closing table of the elements that were removed.

## Running it

`file://` works for almost everything. Serve the folder if you want the audio, the
captions track and the iframe to load without origin restrictions:

```
npx serve            # or: python -m http.server
```

## What the demos need

The `assets/` folder exists so the embedding elements have something real to point at
rather than a dead URL:

| File | Used by |
| --- | --- |
| `photo.svg`, `photo-wide.svg` | `<img>`, `<picture>`, `<object>`, `<embed>`, `<map>` |
| `tone.wav` | `<audio>`, and `<video>` |
| `captions.vtt` | `<track>` |
| `poster.svg` | the `poster` attribute of `<video>` |
| `embedded.html` | `<iframe>` |

No video file ships with the repo, so the `<video>` demo points at the same short audio
clip and the poster stays up while it plays. Everything else about that element —
`<source>` selection, captions, controls, fallback content — is real.

## The things worth carrying away

- **Semantics are the whole point.** `<div>` and `<span>` render the same as `<section>`
  and `<em>`; the difference is what a screen reader, a search crawler and a reader-mode
  extension can do with the page. Choosing the element is an accessibility decision.
- **The browser gives a lot away for free.** `<dialog>` is focus trapping and
  Esc-to-close. `<details>` is a disclosure widget. `<input type="email" required>` is
  validation. Most hand-built versions of these are worse.
- **Pairs that look identical differ in meaning**, not appearance: `<em>`/`<i>`,
  `<strong>`/`<b>`, `<s>`/`<del>`, `<progress>`/`<meter>`.
- **Almost every removed element was presentational.** `<font>`, `<center>`, `<big>`,
  `<marquee>` — HTML doing CSS's job. That is the pattern to recognise, and the reason
  the separation of concerns is worth defending.
