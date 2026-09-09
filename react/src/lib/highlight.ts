/* ==========================================================================
   A ~60 line syntax highlighter, ported from ../../javascript/assets/lesson.js
   and taught to recognise the two things TSX adds: component names and hooks.

   It is a single regular expression, not a parser, so it gets regex literals
   and a few exotic cases wrong. That is a deliberate trade: a real highlighter
   is a dependency and a build-size story, and this file has to explain itself
   in one screen.
   ========================================================================== */

export type Token = { text: string; cls: string }

const KEYWORDS =
  'const|let|var|function|return|if|else|for|of|in|while|do|switch|case|default|' +
  'break|continue|new|class|extends|super|delete|void|try|catch|finally|throw|' +
  'typeof|instanceof|async|await|yield|static|import|export|from|as|type|interface|satisfies'

const LITERALS = 'true|false|null|undefined|NaN|Infinity|this'

const TOKEN = new RegExp(
  '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' + //                                1 comment
    '|(`(?:\\\\[\\s\\S]|[^\\\\`])*`' + //                                      2 string
    "|'(?:\\\\[\\s\\S]|[^\\\\'\\n])*'" +
    '|"(?:\\\\[\\s\\S]|[^\\\\"\\n])*")' +
    '|\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b' + //                         3 number
    '|\\b(' + KEYWORDS + ')\\b' + //                                           4 keyword
    '|\\b(' + LITERALS + ')\\b' + //                                           5 literal
    '|\\b(use[A-Z][A-Za-z0-9_]*)\\b' + //                                      6 hook
    '|\\b([A-Z][A-Za-z0-9_]*)\\b', //                                          7 component / type
  'g',
)

const CLASSES = ['', 'tok-com', 'tok-str', 'tok-num', 'tok-key', 'tok-lit', 'tok-hook', 'tok-cap']

export function tokenize(src: string): Token[] {
  const out: Token[] = []
  let last = 0
  let m: RegExpExecArray | null

  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(src)) !== null) {
    if (m.index > last) out.push({ text: src.slice(last, m.index), cls: '' })
    const group = CLASSES.findIndex((_, i) => i > 0 && m![i] !== undefined)
    out.push({ text: m[0], cls: CLASSES[group] ?? '' })
    last = m.index + m[0].length
  }
  if (last < src.length) out.push({ text: src.slice(last), cls: '' })

  return out
}
