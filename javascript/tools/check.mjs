/*
 * Static validator for the lesson pages.
 *
 * There is no browser available here, so this does what can be checked
 * without one:
 *
 *   • every page in pages/ is listed in assets/topics.js, and vice versa
 *   • <body data-topic="…"> matches the filename
 *   • all three shared assets are linked
 *   • each page has at least one runnable example
 *   • every example is wrapped in a bare block  <script class="run">{ … }</script>
 *     (without this, repeated `const { log } = demo()` collides in the
 *     shared global lexical scope of classic scripts)
 *   • every example body parses
 *
 * Run from the javascript/ directory:  node tools/check.mjs
 */
import fs from 'fs';
import path from 'path';
import url from 'url';
import vm from 'vm';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'pages');

const topics = fs.readFileSync(path.join(root, 'assets/topics.js'), 'utf8');
const slugs = [...topics.matchAll(/s:\s*'([^']+)'/g)].map(m => m[1]);

let errors = 0;
const seen = new Set();

for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.html')) continue;
  const slug = f.replace(/\.html$/, '');
  seen.add(slug);
  const src = fs.readFileSync(path.join(dir, f), 'utf8');

  if (!slugs.includes(slug)) { console.log(`MISSING FROM topics.js: ${slug}`); errors++; }

  const bodyTopic = src.match(/<body data-topic="([^"]+)">/);
  if (!bodyTopic) { console.log(`${f}: no data-topic`); errors++; }
  else if (bodyTopic[1] !== slug) { console.log(`${f}: data-topic "${bodyTopic[1]}" != slug`); errors++; }

  for (const need of ['../assets/lesson.css', '../assets/topics.js', '../assets/lesson.js']) {
    if (!src.includes(need)) { console.log(`${f}: missing ${need}`); errors++; }
  }

  const blocks = [...src.matchAll(/<script class="run">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { console.log(`${f}: no runnable examples`); errors++; }

  blocks.forEach(([, body], i) => {
    if (!/^\s*\{/.test(body)) { console.log(`${f} #${i + 1}: not block-wrapped`); errors++; }
    try { new vm.Script(body); }
    catch (e) { console.log(`${f} #${i + 1}: ${e.message}`); errors++; }
  });

  // $() is scoped to the enclosing <section>, so a literal $('#id') must
  // refer to an id declared in that same section — otherwise it is null
  // at run time and the example dies with a TypeError.
  for (const [section] of src.matchAll(/<section>[\s\S]*?<\/section>/g)) {
    const ids = new Set([...section.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
    for (const m of section.matchAll(/\$\(\s*['"]#([\w-]+)['"]\s*\)/g)) {
      if (!ids.has(m[1])) {
        console.log(`${f}: $('#${m[1]}') is not in its own <section> — use document.getElementById`);
        errors++;
      }
    }
  }
}

const missing = slugs.filter(s => !seen.has(s));
console.log(`\n${seen.size} pages written, ${missing.length} still to write, ${errors} error(s)`);
if (missing.length) console.log('todo: ' + missing.join(' '));

process.exit(errors ? 1 : 0);
