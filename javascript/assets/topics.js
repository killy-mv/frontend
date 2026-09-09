/* ==========================================================================
   The syllabus. One entry = one page in /pages.
   Order here is the order of the sidebar and of the prev/next arrows.
     s = slug (file name without .html), t = title, d = one-line blurb
   ========================================================================== */

window.TOPICS = [
  {
    g: 'Basics',
    items: [
      { s: 'introduction',   t: 'Introduction',      d: 'What JavaScript is and what it can change on a page.' },
      { s: 'where-to',       t: 'Where To',          d: 'Inline, internal and external scripts; where to put them.' },
      { s: 'output',         t: 'Output',            d: 'innerHTML, document.write, alert and console.log.' },
      { s: 'statements',     t: 'Statements',        d: 'Instructions, semicolons and code blocks.' },
      { s: 'syntax',         t: 'Syntax',            d: 'Values, identifiers, keywords and case sensitivity.' },
      { s: 'comments',       t: 'Comments',          d: 'Single line, multi line, and commenting out code.' },
      { s: 'variables',      t: 'Variables',         d: 'var, let, const and how to declare them.' },
      { s: 'let',            t: 'Let',               d: 'Block scope, redeclaration and the loop classic.' },
      { s: 'const',          t: 'Const',             d: 'Constant references, not constant values.' },
      { s: 'operators',      t: 'Operators',         d: 'Arithmetic, string, logical and ternary operators.' },
      { s: 'arithmetic',     t: 'Arithmetic',        d: 'Precedence, remainder, exponent, increment.' },
      { s: 'assignment',     t: 'Assignment',        d: '=, +=, **=, &&=, ||= and ??=.' },
      { s: 'data-types',     t: 'Data Types',        d: 'The seven primitives plus objects.' },
      { s: 'functions',      t: 'Functions',         d: 'Declaring, calling and returning.' },
      { s: 'objects',        t: 'Objects',           d: 'Properties, methods and the this keyword.' },
      { s: 'events',         t: 'Events',            d: 'Reacting to clicks, input and page load.' }
    ]
  },
  {
    g: 'Strings',
    items: [
      { s: 'strings',          t: 'Strings',          d: 'Quotes, escapes, length and immutability.' },
      { s: 'string-methods',   t: 'String Methods',   d: 'slice, replace, trim, pad, split and friends.' },
      { s: 'string-search',    t: 'String Search',    d: 'indexOf, includes, match and matchAll.' },
      { s: 'string-templates', t: 'String Templates', d: 'Backticks, interpolation and tagged templates.' }
    ]
  },
  {
    g: 'Numbers & Math',
    items: [
      { s: 'numbers',           t: 'Numbers',           d: 'One number type, and the precision that follows.' },
      { s: 'bigint',            t: 'BigInt',            d: 'Integers beyond Number.MAX_SAFE_INTEGER.' },
      { s: 'number-methods',    t: 'Number Methods',    d: 'toFixed, toPrecision, parseInt, parseFloat.' },
      { s: 'number-properties', t: 'Number Properties', d: 'MAX_VALUE, EPSILON, MAX_SAFE_INTEGER, NaN.' },
      { s: 'math',              t: 'Math',              d: 'round, ceil, pow, sqrt, min, max.' },
      { s: 'random',            t: 'Random',            d: 'Math.random and a correct integer range.' }
    ]
  },
  {
    g: 'Arrays',
    items: [
      { s: 'arrays',          t: 'Arrays',          d: 'Creating, reading and growing an array.' },
      { s: 'array-methods',   t: 'Array Methods',   d: 'push, splice, concat, flat, join, at.' },
      { s: 'array-search',    t: 'Array Search',    d: 'indexOf, find, findIndex, includes, some, every.' },
      { s: 'array-sort',      t: 'Array Sort',      d: 'sort, compare functions, reverse, toSorted.' },
      { s: 'array-iteration', t: 'Array Iteration', d: 'forEach, map, filter, reduce, flatMap.' },
      { s: 'array-const',     t: 'Array Const',     d: 'Why a const array can still change.' }
    ]
  },
  {
    g: 'Dates',
    items: [
      { s: 'dates',             t: 'Dates',             d: 'Creating dates and what they really store.' },
      { s: 'date-formats',      t: 'Date Formats',      d: 'ISO, short, long and locale formatting.' },
      { s: 'date-get-methods',  t: 'Date Get Methods',  d: 'getFullYear, getDay, getTime and UTC variants.' },
      { s: 'date-set-methods',  t: 'Date Set Methods',  d: 'setDate, setMonth and date arithmetic.' }
    ]
  },
  {
    g: 'Control Flow',
    items: [
      { s: 'booleans',     t: 'Booleans',     d: 'Truthy, falsy and Boolean().' },
      { s: 'comparisons',  t: 'Comparisons',  d: '== vs ===, and comparing objects.' },
      { s: 'if-else',      t: 'If Else',      d: 'if, else if, else and guard clauses.' },
      { s: 'switch',       t: 'Switch',       d: 'case, break, default and fallthrough.' },
      { s: 'loop-for',     t: 'For Loop',     d: 'The classic three-part loop.' },
      { s: 'loop-for-in',  t: 'For In',       d: 'Looping over object keys (and its array trap).' },
      { s: 'loop-for-of',  t: 'For Of',       d: 'Looping over values of any iterable.' },
      { s: 'loop-while',   t: 'While Loop',   d: 'while and do…while.' },
      { s: 'break',        t: 'Break & Continue', d: 'Skipping iterations and labelled loops.' }
    ]
  },
  {
    g: 'Collections',
    items: [
      { s: 'iterables',   t: 'Iterables',   d: 'What makes something for…of-able.' },
      { s: 'sets',        t: 'Sets',        d: 'Unique values in insertion order.' },
      { s: 'set-methods', t: 'Set Methods', d: 'add, has, delete, union, intersection.' },
      { s: 'maps',        t: 'Maps',        d: 'Key/value pairs with any key type.' },
      { s: 'map-methods', t: 'Map Methods', d: 'get, set, entries, groupBy.' }
    ]
  },
  {
    g: 'The Language',
    items: [
      { s: 'typeof',          t: 'Typeof',          d: 'typeof, instanceof and reliable type checks.' },
      { s: 'type-conversion', t: 'Type Conversion', d: 'Explicit conversion and implicit coercion.' },
      { s: 'destructuring',   t: 'Destructuring',   d: 'Unpacking arrays, objects and parameters.' },
      { s: 'spread-rest',     t: 'Spread & Rest',   d: 'Copying, merging and collecting with "…".' },
      { s: 'bitwise',         t: 'Bitwise',         d: '&, |, ^, ~ and the shift operators.' },
      { s: 'regexp',          t: 'RegExp',          d: 'Patterns, flags, groups and replace.' },
      { s: 'precedence',      t: 'Precedence',      d: 'What binds tighter than what.' },
      { s: 'errors',          t: 'Errors',          d: 'try, catch, finally, throw and error types.' },
      { s: 'scope',           t: 'Scope',           d: 'Block, function and global scope.' },
      { s: 'hoisting',        t: 'Hoisting',        d: 'Declarations move; initialisations do not.' },
      { s: 'strict-mode',     t: 'Strict Mode',     d: 'What "use strict" forbids.' },
      { s: 'this-keyword',    t: 'The this Keyword', d: 'Five call patterns, five values of this.' },
      { s: 'arrow-function',  t: 'Arrow Functions', d: 'Short syntax and no this of their own.' },
      { s: 'modules',         t: 'Modules',         d: 'import / export and module scope.' },
      { s: 'debugging',       t: 'Debugging',       d: 'console methods, debugger and reading errors.' },
      { s: 'style-guide',     t: 'Style Guide',     d: 'Naming, spacing and formatting conventions.' },
      { s: 'best-practices',  t: 'Best Practices',  d: 'Habits that keep code predictable.' },
      { s: 'mistakes',        t: 'Common Mistakes', d: 'The bugs everybody writes once.' },
      { s: 'performance',     t: 'Performance',     d: 'Cheap wins: loops, DOM writes, memoising.' },
      { s: 'reserved-words',  t: 'Reserved Words',  d: 'Names you cannot use.' }
    ]
  },
  {
    g: 'Objects in Depth',
    items: [
      { s: 'object-definitions',  t: 'Object Definitions',  d: 'Four ways to create an object.' },
      { s: 'object-properties',   t: 'Object Properties',   d: 'Adding, deleting and describing properties.' },
      { s: 'object-methods',      t: 'Object Methods',      d: 'keys, values, entries, assign, freeze.' },
      { s: 'object-display',      t: 'Object Display',      d: 'Printing objects without [object Object].' },
      { s: 'object-constructors', t: 'Object Constructors', d: 'Constructor functions and new.' },
      { s: 'object-prototypes',   t: 'Object Prototypes',   d: 'The prototype chain, seen step by step.' },
      { s: 'object-accessors',    t: 'Getters & Setters',   d: 'get and set as computed properties.' },
      { s: 'object-protection',   t: 'Object Protection',   d: 'freeze, seal and preventExtensions.' }
    ]
  },
  {
    g: 'Functions in Depth',
    items: [
      { s: 'function-definitions', t: 'Function Definitions', d: 'Declaration, expression, arrow, Function().' },
      { s: 'function-parameters',  t: 'Function Parameters',  d: 'Defaults, rest and arguments.' },
      { s: 'function-invocation',  t: 'Function Invocation',  d: 'What this is in each call style.' },
      { s: 'function-call',        t: 'call()',               d: 'Borrowing a method for another object.' },
      { s: 'function-apply',       t: 'apply()',              d: 'Same as call, with an argument array.' },
      { s: 'function-bind',        t: 'bind()',               d: 'Locking this to an object.' },
      { s: 'function-closures',    t: 'Closures',             d: 'Functions that remember where they were born.' }
    ]
  },
  {
    g: 'Classes',
    items: [
      { s: 'class-intro',       t: 'Class Intro',       d: 'class, constructor and methods.' },
      { s: 'class-inheritance', t: 'Class Inheritance', d: 'extends, super and overriding.' },
      { s: 'class-static',      t: 'Static & Private',  d: 'static members and #private fields.' }
    ]
  },
  {
    g: 'Asynchronous JS',
    items: [
      { s: 'callbacks',    t: 'Callbacks',    d: 'Passing a function to be called later.' },
      { s: 'asynchronous', t: 'Asynchronous', d: 'The event loop, in slow motion.' },
      { s: 'promises',     t: 'Promises',     d: 'then, catch, finally, all, race.' },
      { s: 'async-await',  t: 'Async / Await', d: 'Promises that read like normal code.' }
    ]
  },
  {
    g: 'HTML DOM',
    items: [
      { s: 'dom-intro',          t: 'DOM Intro',       d: 'The document as a tree of nodes.' },
      { s: 'dom-methods',        t: 'DOM Methods',     d: 'Finding elements six different ways.' },
      { s: 'dom-document',       t: 'DOM Document',    d: 'The document object itself.' },
      { s: 'dom-elements',       t: 'DOM Elements',    d: 'Creating, inserting, moving, removing.' },
      { s: 'dom-html',           t: 'Changing HTML',   d: 'innerHTML, textContent and attributes.' },
      { s: 'dom-forms',          t: 'DOM Forms',       d: 'Reading fields and validating input.' },
      { s: 'dom-css',            t: 'Changing CSS',    d: 'style, classList and CSS variables.' },
      { s: 'dom-animations',     t: 'DOM Animations',  d: 'Animating with timers and rAF.' },
      { s: 'dom-events',         t: 'DOM Events',      d: 'Handler attributes and the event object.' },
      { s: 'dom-event-listener', t: 'Event Listeners', d: 'addEventListener, bubbling, delegation.' },
      { s: 'dom-navigation',     t: 'DOM Navigation',  d: 'Walking parents, children and siblings.' },
      { s: 'dom-nodes',          t: 'DOM Nodes',       d: 'Node types, clone, replace, normalise.' },
      { s: 'dom-collections',    t: 'HTMLCollections', d: 'Live collections and their surprises.' },
      { s: 'dom-node-lists',     t: 'NodeLists',       d: 'Static lists, and how they differ.' }
    ]
  },
  {
    g: 'Browser (BOM)',
    items: [
      { s: 'window',      t: 'Window',      d: 'The global object of the browser.' },
      { s: 'screen',      t: 'Screen',      d: 'Screen size, colour depth, pixel ratio.' },
      { s: 'location',    t: 'Location',    d: 'Reading and changing the URL.' },
      { s: 'history',     t: 'History',     d: 'back, forward and go.' },
      { s: 'navigator',   t: 'Navigator',   d: 'Browser and platform information.' },
      { s: 'popup-alert', t: 'Popup Boxes', d: 'alert, confirm and prompt.' },
      { s: 'timing',      t: 'Timing',      d: 'setTimeout, setInterval and clearing them.' },
      { s: 'cookies',     t: 'Cookies',     d: 'Reading, writing and deleting cookies.' }
    ]
  },
  {
    g: 'Web APIs',
    items: [
      { s: 'api-intro',        t: 'API Intro',        d: 'What a Web API is.' },
      { s: 'forms-api',        t: 'Forms API',        d: 'Constraint validation, FormData.' },
      { s: 'history-api',      t: 'History API',      d: 'pushState and popstate routing.' },
      { s: 'storage-api',      t: 'Storage API',      d: 'localStorage and sessionStorage.' },
      { s: 'worker-api',       t: 'Web Workers',      d: 'Running JavaScript off the main thread.' },
      { s: 'fetch-api',        t: 'Fetch API',        d: 'HTTP requests with promises.' },
      { s: 'geolocation-api',  t: 'Geolocation API',  d: 'Asking the user where they are.' }
    ]
  },
  {
    g: 'AJAX & JSON',
    items: [
      { s: 'ajax-intro',    t: 'AJAX Intro',     d: 'Updating a page without reloading it.' },
      { s: 'ajax-xmlhttp',  t: 'XMLHttpRequest', d: 'The original AJAX object.' },
      { s: 'ajax-request',  t: 'Request & Response', d: 'Methods, headers, status and body.' },
      { s: 'json-intro',    t: 'JSON Intro',     d: 'A text format for exchanging data.' },
      { s: 'json-syntax',   t: 'JSON Syntax',    d: 'The rules, and how they differ from JS.' },
      { s: 'json-datatypes', t: 'JSON Data Types', d: 'What JSON can and cannot hold.' },
      { s: 'json-parse',    t: 'JSON.parse',     d: 'Text to objects, with a reviver.' },
      { s: 'json-stringify', t: 'JSON.stringify', d: 'Objects to text, with a replacer.' },
      { s: 'json-objects',  t: 'JSON Objects',   d: 'Nested objects and dot access.' },
      { s: 'json-arrays',   t: 'JSON Arrays',    d: 'Arrays of records, looped and rendered.' }
    ]
  },
  {
    g: 'Versions',
    items: [
      { s: 'es5',        t: 'ES5 (2009)',      d: 'strict mode, JSON, array methods.' },
      { s: 'es6',        t: 'ES6 (2015)',      d: 'let/const, arrows, classes, promises.' },
      { s: 'es-2016-18', t: 'ES2016–ES2018',   d: '**, includes, async/await, spread.' },
      { s: 'es-2019-21', t: 'ES2019–ES2021',   d: 'flat, optional chaining, ??, replaceAll.' },
      { s: 'es-2022-25', t: 'ES2022 onward',   d: 'at(), #private, toSorted, Object.groupBy.' },
      { s: 'js-history', t: 'JS History',      d: 'From LiveScript to yearly releases.' }
    ]
  },
  {
    g: 'Graphics',
    items: [
      { s: 'canvas', t: 'Canvas', d: 'Drawing shapes, text and an animation loop.' }
    ]
  }
];
