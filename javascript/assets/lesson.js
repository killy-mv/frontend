/* ==========================================================================
   JavaScript by Example — lesson runtime
   --------------------------------------------------------------------------
   Every lesson page loads this file in <head> (synchronously, on purpose) and
   then writes plain <script class="run"> blocks in the body. This file:

     1. gives those blocks a `demo()` helper that returns a `log()` function,
     2. after the page parses, prints each block's own source code next to the
        output it produced, so the code you read is literally the code that ran,
     3. builds the sidebar / breadcrumb / prev-next navigation from topics.js.

   No frameworks, no build step, no modules — it runs straight off the disk.
   ========================================================================== */

(function () {
  'use strict';

  var records = []; // one per <script class="run"> that called demo()

  /* ---------- value formatting (a tiny console.log clone) ---------------- */

  function fmt(value, depth, seen) {
    depth = depth || 0;
    seen = seen || [];
    var t = typeof value;

    if (value === null) return 'null';
    if (t === 'undefined') return 'undefined';
    if (t === 'string') return depth === 0 ? value : JSON.stringify(value);
    if (t === 'number' || t === 'boolean') return String(value);
    if (t === 'bigint') return value + 'n';
    if (t === 'symbol') return value.toString();
    if (t === 'function') return 'ƒ ' + (value.name || 'anonymous') + '()';

    if (seen.indexOf(value) !== -1) return '[Circular]';
    if (depth > 4) return '…';
    seen = seen.concat([value]);

    if (value instanceof Error) return value.name + ': ' + value.message;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return String(value);
    if (value instanceof Node) return '<' + value.nodeName.toLowerCase() + '>';

    if (Array.isArray(value)) {
      return '[' + value.map(function (v) { return fmt(v, depth + 1, seen); }).join(', ') + ']';
    }
    if (typeof Set !== 'undefined' && value instanceof Set) {
      return 'Set(' + value.size + ') {' +
        Array.from(value).map(function (v) { return fmt(v, depth + 1, seen); }).join(', ') + '}';
    }
    if (typeof Map !== 'undefined' && value instanceof Map) {
      return 'Map(' + value.size + ') {' + Array.from(value).map(function (e) {
        return fmt(e[0], depth + 1, seen) + ' => ' + fmt(e[1], depth + 1, seen);
      }).join(', ') + '}';
    }
    if (typeof Promise !== 'undefined' && value instanceof Promise) return 'Promise { … }';

    var keys = Object.keys(value);
    if (!keys.length) return '{}';
    return '{ ' + keys.map(function (k) {
      return k + ': ' + fmt(value[k], depth + 1, seen);
    }).join(', ') + ' }';
  }

  /* ---------- demo(): the API every example script uses ------------------ */

  window.demo = function demo() {
    var script = document.currentScript;
    var rec = { script: script, buffer: [], out: null };
    records.push(rec);

    function write(line) {
      if (rec.out) {
        rec.out.classList.remove('empty');
        rec.out.appendChild(document.createTextNode(line + '\n'));
      } else {
        rec.buffer.push(line);
      }
    }

    function log() {
      write(Array.prototype.map.call(arguments, function (a) { return fmt(a); }).join(' '));
    }

    log.clear = function () {
      if (rec.out) {
        rec.out.textContent = '';
        rec.out.classList.add('empty');
      }
      rec.buffer.length = 0;
    };

    // Scope queries to the surrounding <section> so ids stay simple and local.
    function root() {
      return (script && script.closest && script.closest('section')) || document;
    }

    return {
      log: log,
      $: function (sel) { return root().querySelector(sel); },
      $$: function (sel) { return Array.prototype.slice.call(root().querySelectorAll(sel)); }
    };
  };

  /* ---------- uncaught errors are shown, not swallowed -------------------- */

  // An inline script that throws stops there, and the browser only whispers
  // about it in the console. Attribute it to the example that was running —
  // demo() is always the first line, so that is the newest record.
  window.addEventListener('error', function (event) {
    var rec = records[records.length - 1];
    if (!rec) return;
    var text = '⚠ ' + (event.error ? event.error.name + ': ' + event.error.message
                                   : event.message);
    if (rec.out) {
      rec.out.classList.remove('empty');
      var line = document.createElement('b');
      line.className = 'err';
      line.textContent = text + '\n';
      rec.out.appendChild(line);
    } else {
      rec.buffer.push(text);
    }
  });

  /* ---------- syntax highlighting ---------------------------------------- */

  var KEYWORDS = 'const|let|var|function|return|if|else|for|of|in|while|do|switch|case|default|break|continue|new|class|extends|super|delete|void|try|catch|finally|throw|typeof|instanceof|async|await|yield|static|get|set|import|export|from';
  var LITERALS = 'true|false|null|undefined|NaN|Infinity|this';
  var TOKEN = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +                              // 1 comment
    '|(`(?:\\\\[\\s\\S]|[^\\\\`])*`|\'(?:\\\\[\\s\\S]|[^\\\\\'\\n])*\'|"(?:\\\\[\\s\\S]|[^\\\\"\\n])*")' + // 2 string
    '|\\b(0[xXbBoO][0-9a-fA-F]+n?|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?n?)\\b' + // 3 number
    '|\\b(' + KEYWORDS + ')\\b' +                                           // 4 keyword
    '|\\b(' + LITERALS + ')\\b',                                            // 5 literal
    'g'
  );

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src) {
    var html = '';
    var last = 0;
    var m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src)) !== null) {
      html += esc(src.slice(last, m.index));
      var cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-num' : m[4] ? 'tok-key' : 'tok-lit';
      html += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return html + esc(src.slice(last));
  }

  /* ---------- turn each run-script into a printed example ---------------- */

  function tidy(src) {
    var lines = src.replace(/\t/g, '  ').split('\n');

    // Drop the demo() plumbing line and anything explicitly marked //hide.
    lines = lines.filter(function (l) {
      return !/=\s*demo\(\)\s*;?\s*$/.test(l) && !/\/\/\s*hide\s*$/.test(l);
    });

    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

    // Every example is written inside a bare block so that its declarations
    // cannot collide with the other scripts on the page. The braces are
    // plumbing, not part of the lesson, so they are not printed.
    if (lines.length > 1 && lines[0].trim() === '{' && lines[lines.length - 1].trim() === '}') {
      lines = lines.slice(1, -1);
      while (lines.length && !lines[0].trim()) lines.shift();
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    }

    var indent = lines.reduce(function (min, l) {
      if (!l.trim()) return min;
      return Math.min(min, l.match(/^ */)[0].length);
    }, Infinity);
    if (indent === Infinity) indent = 0;

    return lines.map(function (l) { return l.slice(indent); }).join('\n');
  }

  function renderExamples() {
    records.forEach(function (rec) {
      var box = document.createElement('div');
      box.className = 'example';

      // A hand-written .stage right above the script visually joins onto it.
      var before = rec.script.previousElementSibling;
      if (before && before.classList.contains('stage')) box.classList.add('attached');

      var code = document.createElement('pre');
      code.className = 'code';
      code.innerHTML = '<code>' + highlight(tidy(rec.script.textContent)) + '</code>';

      var out = document.createElement('pre');
      out.className = 'out empty';

      box.appendChild(code);
      box.appendChild(out);
      rec.script.parentNode.insertBefore(box, rec.script.nextSibling);

      rec.out = out;
      if (rec.buffer.length) {
        out.classList.remove('empty');
        out.textContent = rec.buffer.join('\n') + '\n';
        rec.buffer.length = 0;
      }
    });
  }

  /* ---------- navigation built from topics.js ---------------------------- */

  function flatten() {
    var flat = [];
    (window.TOPICS || []).forEach(function (group) {
      group.items.forEach(function (item) {
        flat.push({ group: group.g, slug: item.s, title: item.t, blurb: item.d });
      });
    });
    return flat;
  }

  function link(item, cls) {
    var a = document.createElement('a');
    a.href = item.slug + '.html';
    a.textContent = item.title;
    if (cls) a.className = cls;
    return a;
  }

  function buildChrome() {
    var slug = document.body.dataset.topic;
    if (!slug) return; // not a lesson page (the hub builds its own chrome)

    var flat = flatten();
    var i = flat.findIndex(function (t) { return t.slug === slug; });
    var me = flat[i] || { group: '', title: document.title, slug: slug };
    var prev = i > 0 ? flat[i - 1] : null;
    var next = i > -1 && i < flat.length - 1 ? flat[i + 1] : null;

    /* top bar */
    var bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML =
      '<a class="brand" href="../index.html">JavaScript <span>by Example</span></a>' +
      '<span class="crumb">' + esc(me.group) + ' › ' + esc(me.title) +
      ' <b>#' + (i + 1) + '</b> of ' + flat.length + '</span>' +
      '<span class="spacer"></span><nav class="pager"></nav>';
    var pager = bar.querySelector('.pager');
    if (prev) { var p = link(prev); p.textContent = '← ' + prev.title; pager.appendChild(p); }
    if (next) { var n = link(next); n.textContent = next.title + ' →'; pager.appendChild(n); }
    document.body.insertBefore(bar, document.body.firstChild);

    /* frame: sidebar + content */
    var frame = document.createElement('div');
    frame.className = 'page';
    var side = document.createElement('nav');
    side.className = 'sidebar';
    var content = document.createElement('div');
    content.className = 'content';

    while (bar.nextSibling) content.appendChild(bar.nextSibling);
    frame.appendChild(side);
    frame.appendChild(content);
    document.body.appendChild(frame);

    (window.TOPICS || []).forEach(function (group) {
      var open = group.items.some(function (it) { return it.s === slug; });
      var d = document.createElement('details');
      if (open) d.open = true;
      var s = document.createElement('summary');
      s.textContent = group.g;
      d.appendChild(s);
      var ol = document.createElement('ol');
      group.items.forEach(function (it) {
        var li = document.createElement('li');
        li.appendChild(link({ slug: it.s, title: it.t }, it.s === slug ? 'current' : ''));
        ol.appendChild(li);
      });
      d.appendChild(ol);
      side.appendChild(d);
    });

    /* footer pager */
    var foot = document.createElement('nav');
    foot.className = 'pager-foot';
    foot.innerHTML =
      (prev ? '<a class="prev" href="' + prev.slug + '.html"><small>Previous</small>' + esc(prev.title) + '</a>'
            : '<a class="prev ghost" href="#"></a>') +
      (next ? '<a class="next" href="' + next.slug + '.html"><small>Next</small>' + esc(next.title) + '</a>'
            : '<a class="next ghost" href="#"></a>');
    content.appendChild(foot);

    /* ← / → move between lessons when you are not typing in a field */
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.metaKey || e.ctrlKey) return;
      if (e.key === 'ArrowLeft' && prev) location.href = prev.slug + '.html';
      if (e.key === 'ArrowRight' && next) location.href = next.slug + '.html';
    });

    var side2 = side.querySelector('a.current');
    if (side2) side2.scrollIntoView({ block: 'center' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderExamples();
    buildChrome();
  });
})();
