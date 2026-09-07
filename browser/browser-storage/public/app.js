// Every action is deliberately written the long way, with no helper library, so
// the actual browser API being exercised is visible in the source.

// --- tiny logging helper ----------------------------------------------------

// Panels are addressed by a short key; the section ids they map to are also
// accepted, so the error handler can pass `section.id` straight through.
const PANEL = { cookies: 'cookies', ls: 'localstorage', idb: 'indexeddb', cache: 'cache' }
const logEl = (panel) => document.getElementById(`log-${PANEL[panel] ?? panel}`)

function logTo(panel, text, cls = '') {
  const el = logEl(panel)
  const line = document.createElement('span')
  if (cls) line.className = cls
  line.textContent = text + '\n'
  el.appendChild(line)
  el.scrollTop = el.scrollHeight
}

const log = {
  cookies: (t, c) => logTo('cookies', t, c),
  ls: (t, c) => logTo('ls', t, c),
  idb: (t, c) => logTo('idb', t, c),
  cache: (t, c) => logTo('cache', t, c),
}

function clearLog(panel) {
  logEl(panel).textContent = ''
}

const bytes = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`

// ============================================================================
// 1 · COOKIES
// ============================================================================

const cookies = {
  // Writing a cookie from JS is a single assignment to a magic string property.
  // Reading gives you every readable cookie joined together — there is no API
  // for "get one cookie", which is why every codebase reinvents this parser.
  jsSet() {
    clearLog('cookies')
    const value = `js-${Date.now()}`
    document.cookie = `js_note=${value}; Path=/; Max-Age=3600; SameSite=Lax`
    log.cookies(`document.cookie = "js_note=${value}; Path=/; Max-Age=3600; SameSite=Lax"`)
    log.cookies('✓ written — check the Cookies table in DevTools', 'ok')
  },

  async serverSet() {
    clearLog('cookies')
    log.cookies('GET /api/set-cookies …', 'dim')
    const res = await fetch('/api/set-cookies')
    const body = await res.json()
    log.cookies(`\nResponse headers included:`)
    for (const sent of body.sent) log.cookies(`  Set-Cookie: ${sent}`)
    log.cookies(`\n${body.note}`, 'ok')
    log.cookies('The browser stored them before your code ever saw the response.', 'dim')
  },

  jsRead() {
    clearLog('cookies')
    const raw = document.cookie
    log.cookies('document.cookie →')
    if (!raw) {
      log.cookies('  (empty)', 'dim')
      return
    }
    for (const pair of raw.split('; ')) log.cookies(`  ${pair}`)
    log.cookies(
      `\n${raw.includes('session=') ? '' : 'Notice "session" is missing. '}HttpOnly cookies are ` +
        'invisible here by design — that is what makes them safe against XSS.',
      'ok',
    )
  },

  async serverRead() {
    clearLog('cookies')
    log.cookies('GET /api/whoami …', 'dim')
    const res = await fetch('/api/whoami')
    const body = await res.json()
    log.cookies(`\nThe server received ${body.count} cookie(s):`)
    for (const [k, v] of Object.entries(body.cookiesTheServerReceived)) log.cookies(`  ${k} = ${v}`)
    log.cookies(`\n${body.note}`, 'ok')
  },

  async clear() {
    clearLog('cookies')
    await fetch('/api/clear-cookies')
    document.cookie = 'js_note=; Path=/; Max-Age=0; SameSite=Lax'
    log.cookies('All cleared. Deleting a cookie is really "set it again with Max-Age=0".', 'ok')
  },
}

// ============================================================================
// 2 · localStorage
// ============================================================================

const FILE_KEY = 'demo:file'

const local = {
  saveNote() {
    clearLog('ls')
    const input = document.getElementById('ls-note')
    const text = input.value.trim() || 'hello from localStorage'

    // localStorage holds strings and nothing else, so an object must be encoded.
    const record = { text, savedAt: new Date().toISOString() }
    localStorage.setItem('demo:note', JSON.stringify(record))

    log.ls(`localStorage.setItem("demo:note", '${JSON.stringify(record)}')`)
    log.ls('\n✓ written synchronously — the DevTools row appeared as you clicked', 'ok')
    log.ls('Read it back with JSON.parse(); the browser never knew it was an object.', 'dim')
    input.value = ''
  },

  storeFile() {
    clearLog('ls')
    const file = document.getElementById('ls-file').files[0]
    if (!file) return log.ls('Pick a file first (a small image works best).', 'err')

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result // "data:image/png;base64,iVBORw0…"
      try {
        localStorage.setItem(FILE_KEY, dataUrl)
        localStorage.setItem(`${FILE_KEY}:name`, file.name)
        log.ls(`file      ${file.name}`)
        log.ls(`type      ${file.type || 'unknown'}`)
        log.ls(`on disk   ${bytes(file.size)}`)
        log.ls(`as base64 ${bytes(dataUrl.length)}  (+${Math.round((dataUrl.length / file.size - 1) * 100)}%)`)
        log.ls(`\n✓ stored as one string of ${dataUrl.length.toLocaleString()} characters`, 'ok')
        log.ls('That inflation is the cost of forcing binary through a text-only store.', 'dim')
      } catch (err) {
        log.ls(`✗ ${err.name}: the file is too big for the ~5 MB quota`, 'err')
      }
    }
    reader.readAsDataURL(file)
  },

  restoreFile() {
    clearLog('ls')
    const dataUrl = localStorage.getItem(FILE_KEY)
    const preview = document.getElementById('ls-preview')
    preview.innerHTML = ''
    if (!dataUrl) return log.ls('Nothing stored yet — use "Store the file" first.', 'err')

    const name = localStorage.getItem(`${FILE_KEY}:name`) ?? 'file'
    log.ls(`Read ${bytes(dataUrl.length)} of string back out of localStorage.`)
    if (dataUrl.startsWith('data:image/')) {
      const img = new Image()
      img.src = dataUrl
      img.alt = name
      preview.appendChild(img)
      log.ls(`✓ decoded back into an image → ${name}`, 'ok')
    } else {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = name
      a.textContent = `download ${name}`
      preview.appendChild(a)
      log.ls(`✓ not an image, so here is a download link → ${name}`, 'ok')
    }
  },

  list() {
    clearLog('ls')
    if (localStorage.length === 0) return log.ls('localStorage is empty.', 'dim')
    log.ls(`${localStorage.length} key(s):\n`)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      const preview = value.length > 60 ? `${value.slice(0, 60)}…` : value
      log.ls(`  ${key.padEnd(18)} ${bytes(value.length).padStart(9)}  ${preview}`)
    }
    log.ls('\nIf you quit the browser and came back, this survived a process restart.', 'ok')
  },

  async usage() {
    clearLog('ls')
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      total += key.length + localStorage.getItem(key).length
    }
    log.ls(`localStorage for this origin: ${bytes(total)} across ${localStorage.length} key(s)`)
    log.ls('The cap is roughly 5 MB and it is per origin, not per tab.\n', 'dim')

    // The quota shared by IndexedDB, Cache API and OPFS is much larger and is
    // reported by the Storage Manager rather than measured by hand.
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate()
      log.ls('navigator.storage.estimate() — the origin-wide quota:')
      log.ls(`  used  ${bytes(usage)}`)
      log.ls(`  quota ${bytes(quota)}  (${((usage / quota) * 100).toFixed(3)}% used)`)
      log.ls('\nThat larger pool is shared by IndexedDB, the Cache API and OPFS.', 'dim')
    }
  },

  fill() {
    clearLog('ls')
    const chunk = 'x'.repeat(100_000) // ~100 KB per key, UTF-16 so ~200 KB stored
    const written = []
    log.ls('Writing 100,000-character chunks until the browser refuses…\n', 'dim')
    try {
      for (let i = 0; i < 200; i++) {
        const key = `demo:filler:${i}`
        localStorage.setItem(key, chunk)
        written.push(key)
      }
      log.ls('Filled 20 MB without complaint — unusually generous quota.', 'ok')
    } catch (err) {
      log.ls(`✗ ${err.name} after ${written.length} chunks`, 'err')
      log.ls(`  ≈ ${bytes(written.length * chunk.length)} of characters fit before the wall.`)
      log.ls('\nThis throws synchronously and takes the rest of your function with it,', 'dim')
      log.ls('which is why real code wraps setItem in try/catch.', 'dim')
    } finally {
      for (const key of written) localStorage.removeItem(key)
      log.ls(`\nCleaned up ${written.length} filler keys so the quota is free again.`, 'dim')
    }
  },

  clear() {
    clearLog('ls')
    localStorage.clear()
    document.getElementById('ls-preview').innerHTML = ''
    log.ls('localStorage.clear() — every key for this origin is gone.', 'ok')
  },
}

// ============================================================================
// 3 · IndexedDB
// ============================================================================

const DB_NAME = 'browser-storage-demo'
let db = null // the open connection, kept so we can close it before a migration

// IndexedDB predates promises, so every request is an event-emitting object.
// This wrapper is the boilerplate that libraries like idb exist to remove.
function openDb(version) {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close() // a connection left open will block the version change
      db = null
    }
    const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME)

    request.onupgradeneeded = (event) => {
      const { oldVersion, newVersion } = event
      const upgrading = request.result
      log.idb(`onupgradeneeded: v${oldVersion} → v${newVersion}`, 'ok')

      // v1 — the "books" table, with two searchable fields
      if (oldVersion < 1 && newVersion >= 1) {
        const books = upgrading.createObjectStore('books', { keyPath: 'id', autoIncrement: true })
        books.createIndex('by_author', 'author', { unique: false })
        books.createIndex('by_year', 'year', { unique: false })
        log.idb('  + object store "books" (keyPath: id, autoIncrement)')
        log.idb('  + index "by_author" on .author')
        log.idb('  + index "by_year" on .year')
      }

      // v2 — a real migration: one new store, one new index on the old store
      if (oldVersion < 2 && newVersion >= 2) {
        const authors = upgrading.createObjectStore('authors', { keyPath: 'name' })
        authors.createIndex('by_country', 'country', { unique: false })
        log.idb('  + object store "authors" (keyPath: name)')
        log.idb('  + index "by_country" on .country')
        // Existing stores are reached through the upgrade transaction.
        request.transaction.objectStore('books').createIndex('by_title', 'title', { unique: false })
        log.idb('  + index "by_title" on books.title')
      }
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('blocked — another tab has this database open'))
  })
}

function tx(storeNames, mode, work) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode)
    let result
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error)
    result = work(transaction)
  })
}

const req = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const SAMPLE_BOOKS = [
  { title: 'The Dispossessed', author: 'Le Guin', year: 1974 },
  { title: 'A Wizard of Earthsea', author: 'Le Guin', year: 1968 },
  { title: 'Solaris', author: 'Lem', year: 1961 },
  { title: 'Roadside Picnic', author: 'Strugatsky', year: 1972 },
  { title: 'Hyperion', author: 'Simmons', year: 1989 },
]

const idb = {
  async create(version) {
    clearLog('idb')
    try {
      await openDb(version)
      log.idb(`\n✓ "${DB_NAME}" is open at version ${db.version}`, 'ok')
      log.idb('Expand it in DevTools → Application → IndexedDB to see the tree.', 'dim')
    } catch (err) {
      if (err.name === 'VersionError') {
        log.idb(`✗ the database is already at a higher version than ${version}.`, 'err')
        log.idb('IndexedDB versions only go up. Delete it first to start over.', 'dim')
      } else {
        log.idb(`✗ ${err.name}: ${err.message}`, 'err')
      }
    }
  },

  async add() {
    clearLog('idb')
    if (!db) return log.idb('Open the database first with "Create v1".', 'err')

    const picks = [...SAMPLE_BOOKS].sort(() => Math.random() - 0.5).slice(0, 3)
    await tx('books', 'readwrite', (t) => {
      const store = t.objectStore('books')
      for (const book of picks) store.add(book) // no id — autoIncrement assigns one
    })

    log.idb('Added 3 records to "books":\n')
    for (const b of picks) log.idb(`  ${JSON.stringify(b)}`)
    log.idb('\n✓ stored as real objects, not strings — no JSON.stringify anywhere', 'ok')
    log.idb('Click "books" in the DevTools sidebar to expand them.', 'dim')
  },

  async schema() {
    clearLog('idb')
    if (!db) await openDb()
    log.idb(`${DB_NAME} — version ${db.version}\n`)

    const names = [...db.objectStoreNames]
    if (names.length === 0) return log.idb('  (no object stores yet)', 'dim')

    // Every request has to be *started* while the transaction is still active,
    // so collect the promises first and await them afterwards. An `await` in the
    // middle of a transaction lets it auto-commit out from under you.
    const transaction = db.transaction(names, 'readonly')
    const stores = names.map((name) => {
      const store = transaction.objectStore(name)
      return {
        name,
        keyPath: store.keyPath,
        indexes: [...store.indexNames].map((i) => store.index(i)).map((i) => `${i.name} → .${i.keyPath}`),
        count: req(store.count()),
      }
    })

    for (const store of stores) {
      log.idb(`  ${store.name}  —  key: ${store.keyPath}, ${await store.count} record(s)`)
      for (const index of store.indexes) log.idb(`      index ${index}`)
    }
  },

  async query() {
    clearLog('idb')
    if (!db) return log.idb('Open the database first with "Create v1".', 'err')

    const author = 'Le Guin'
    const found = await new Promise((resolve, reject) => {
      const request = db.transaction('books', 'readonly').objectStore('books').index('by_author').getAll(author)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    log.idb(`books.index("by_author").getAll("${author}") →\n`)
    if (found.length === 0) log.idb('  no matches — press "Add 3 books" a few times', 'dim')
    for (const b of found) log.idb(`  #${b.id}  ${b.title} (${b.year})`)
    log.idb(`\n✓ ${found.length} match(es) found via the index, without scanning the store`, 'ok')
  },

  async all() {
    clearLog('idb')
    if (!db) return log.idb('Open the database first with "Create v1".', 'err')
    for (const name of db.objectStoreNames) {
      const rows = await new Promise((resolve, reject) => {
        const request = db.transaction(name, 'readonly').objectStore(name).getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      log.idb(`${name} — ${rows.length} record(s)`)
      for (const row of rows) log.idb(`  ${JSON.stringify(row)}`)
      log.idb('')
    }
  },

  async delete() {
    clearLog('idb')
    if (db) {
      db.close()
      db = null
    }
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME)
      request.onsuccess = request.onerror = request.onblocked = resolve
    })
    log.idb(`"${DB_NAME}" deleted. The DevTools tree empties out.`, 'ok')
  },
}

// ============================================================================
// 4 · CACHE API
// ============================================================================

const CACHE_NAME = 'mini-site-v1'
const MINI_SITE = ['/mini-site/', '/mini-site/style.css', '/mini-site/logo.svg', '/mini-site/data.json']

const cache = {
  async put() {
    clearLog('cache')
    log.cache(`caches.open("${CACHE_NAME}")`)
    const c = await caches.open(CACHE_NAME)

    log.cache(`cache.addAll([…${MINI_SITE.length} urls])  — fetches each one, then stores the response\n`, 'dim')
    await c.addAll(MINI_SITE)
    for (const url of MINI_SITE) log.cache(`  ✓ ${url}`, 'ok')

    log.cache('\nWhat is stored is the whole HTTP response — status line, headers and body.', 'ok')
    log.cache('Open Application → Cache Storage and click an entry to see the headers.', 'dim')
  },

  async list() {
    clearLog('cache')
    const names = await caches.keys()
    if (names.length === 0) return log.cache('No caches for this origin yet.', 'dim')

    for (const name of names) {
      const c = await caches.open(name)
      const requests = await c.keys()
      log.cache(`${name} — ${requests.length} entr(ies)`)
      for (const request of requests) {
        const response = await c.match(request)
        const size = (await response.clone().blob()).size
        log.cache(`  ${response.status}  ${bytes(size).padStart(9)}  ${new URL(request.url).pathname}`)
        log.cache(`         content-type: ${response.headers.get('content-type')}`, 'dim')
      }
    }
  },

  async read() {
    clearLog('cache')
    const json = await caches.match('/mini-site/data.json')
    const html = await caches.match('/mini-site/')
    if (!json || !html) return log.cache('Nothing cached yet — press "Fetch & cache the mini-site".', 'err')

    log.cache('caches.match("/mini-site/data.json") →')
    log.cache(JSON.stringify(await json.json(), null, 2))
    log.cache('\ncaches.match("/mini-site/") → first 160 chars of the HTML:')
    log.cache((await html.text()).slice(0, 160).trimEnd() + '…', 'dim')
    log.cache('\n✓ Both came from disk. Check the Network tab — nothing was requested.', 'ok')
  },

  async sw() {
    clearLog('cache')
    if (!('serviceWorker' in navigator)) return log.cache('This browser has no service workers.', 'err')

    const registration = await navigator.serviceWorker.register('/mini-site/sw.js', { scope: '/mini-site/' })
    log.cache(`registered → scope ${registration.scope}`, 'ok')
    log.cache('\nThe worker now sits between the network and every request under /mini-site/.')
    log.cache('It answers from the cache first and only falls back to the network.\n', 'dim')
    log.cache('Try it:')
    log.cache('  1. DevTools → Network → throttling → Offline')
    log.cache('  2. open http://localhost:5180/mini-site/')
    log.cache('  3. it loads anyway — you can even stop the server')
    log.cache('\nSee it listed under Application → Service Workers.', 'dim')
  },

  async clear() {
    clearLog('cache')
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      if (registration.scope.includes('/mini-site/')) {
        await registration.unregister()
        log.cache(`unregistered ${registration.scope}`)
      }
    }
    for (const name of await caches.keys()) {
      await caches.delete(name)
      log.cache(`deleted cache "${name}"`)
    }
    log.cache('\nBack to normal. Turn throttling off and reload /mini-site/.', 'ok')
  },
}

// ============================================================================
// wiring
// ============================================================================

const actions = {
  'cookie-js-set': cookies.jsSet,
  'cookie-server-set': cookies.serverSet,
  'cookie-js-read': cookies.jsRead,
  'cookie-server-read': cookies.serverRead,
  'cookie-clear': cookies.clear,

  'ls-save-note': local.saveNote,
  'ls-store-file': local.storeFile,
  'ls-restore-file': local.restoreFile,
  'ls-list': local.list,
  'ls-usage': local.usage,
  'ls-fill': local.fill,
  'ls-clear': local.clear,

  'idb-v1': () => idb.create(1),
  'idb-v2': () => idb.create(2),
  'idb-add': idb.add,
  'idb-schema': idb.schema,
  'idb-query': idb.query,
  'idb-all': idb.all,
  'idb-delete': idb.delete,

  'cache-put': cache.put,
  'cache-list': cache.list,
  'cache-read': cache.read,
  'cache-sw': cache.sw,
  'cache-clear': cache.clear,
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-act]')
  if (!button) return
  const action = actions[button.dataset.act]
  if (!action) return
  try {
    await action()
  } catch (err) {
    console.error(err)
    logTo(button.closest('.panel').id, `✗ ${err.name}: ${err.message}`, 'err')
  }
})
