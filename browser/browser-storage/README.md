# Store things — the browser's four storage systems

The companion to the **store things** part of [`../README.md`](../README.md). One page, four
panels, a button for every action, and instructions for watching each one land on disk. Nothing is
mocked — every button calls the real API, and the point of the demo is that you go and look at the
result in DevTools rather than trust the log output.

```
npm start        # http://localhost:5180
```

No dependencies and no build step. The server is one file of plain Node, and the page is vanilla
HTML and JavaScript on purpose: the browser API being exercised should be the only thing in the
source, with no framework in front of it.

Keep DevTools open on the **Application** tab the whole time (`F12` → Application; Firefox calls it
Storage). That panel is the window into all four systems, and most of the demo is watching rows
appear in it as you click.

## Why a server at all

Two of the four cannot be demonstrated from a `file://` page. Only a server can send `Set-Cookie`,
which is how most real cookies come to exist, and the Cache API stores whole HTTP responses, so
there has to be something real to fetch. `server/index.mjs` therefore does two jobs: it serves the
demo, and it hosts a small four-file site at `/mini-site/` for panel 4 to cache.

## The four panels

| | System | Shape | Capacity | Sync? |
| --- | --- | --- | --- | --- |
| 1 | **Cookies** | string pairs, sent with every request | ~4 KB each | sync |
| 2 | **localStorage** | key → string | ~5 MB | **sync** |
| 3 | **IndexedDB** | object stores, keys, indexes | hundreds of MB | async |
| 4 | **Cache API** | Request → Response | hundreds of MB | async |

### 1 · Cookies — the ones the browser handles for you

The distinguishing feature is not persistence, it is that the browser **attaches cookies to
outgoing requests by itself**. You never write the `Cookie:` header; it appears because the browser
decided it belonged there. That is what turns a stateless protocol into a session.

The panel sets cookies both ways — `document.cookie` from JavaScript, and `Set-Cookie` from the
server — so you can compare them in the DevTools table. The one worth staring at is `session`, which
the server marks `HttpOnly`:

- **Read with JavaScript** returns `visitor_id` and `theme`, but not `session`
- **Ask the server what it sees** returns all three

Same jar, two different views. `HttpOnly` means the browser will store a value and faithfully send
it back forever while refusing to let any script on the page read it — which is exactly what you
want for a session token, because it survives an XSS bug that would otherwise leak it.

Then open the **Network** tab, click any request, and look at the `Cookie:` request header. Nothing
in `app.js` wrote that.

### 2 · localStorage — strings, synchronously

Two constraints define it: values are **strings only**, and access is **synchronous**. The first is
why saving an object needs `JSON.stringify`, and why the "store a file" button reads the file as a
base64 data URL — the log prints the size before and after so you can see the ~33% inflation that
forcing binary through a text-only store costs you. The second is why `localStorage` is a
performance footgun: a large read blocks the main thread, and the page cannot paint while it runs.

**Fill until full** writes 100,000-character chunks until the browser throws `QuotaExceededError`,
then cleans up after itself. Worth doing once, because that error throws *synchronously* and takes
the rest of the function with it, which is why real code wraps `setItem` in `try`/`catch`.

The persistence proof is the one to actually perform: save a note, then **quit the whole browser** —
the application, not the tab — reopen it, come back, and press **List everything**. It survived a
process restart because it was written to a LevelDB file inside your browser profile.

**Measure usage** also calls `navigator.storage.estimate()`, which reports the much larger
origin-wide quota shared by IndexedDB, the Cache API and OPFS.

### 3 · IndexedDB — the real database

The vocabulary maps onto SQL loosely: an **object store** is the table, a **key path** is the
primary key, an **index** is a field you want to search by. Records are stored as structured objects,
not text, so there is no `JSON.stringify` anywhere in this panel.

Schema changes only happen inside `onupgradeneeded`, which fires when you open the database with a
version number higher than the stored one. **Create v1** makes a `books` store with `by_author` and
`by_year` indexes; **Migrate to v2** adds an `authors` store and a `by_title` index to the existing
store. That is a real migration, and the DevTools tree redraws to match. Versions only ever go up —
asking for v1 after migrating throws `VersionError`, which the panel reports rather than swallows.

Two details in the source worth more than the buttons. First, `openDb` closes any existing
connection before reopening, because a connection left open elsewhere **blocks** the version change
— the same reason a migration can hang when you have the app open in a second tab. Second,
`idb.schema` starts every request *before* awaiting any of them: an `await` in the middle of a
transaction lets it auto-commit out from under you, and that is the single most common way to get a
`TransactionInactiveError`.

The API predates promises, so everything is an event-emitting request object. The small `req` and
`tx` wrappers at the top of the section are exactly the boilerplate that libraries like
[idb](https://github.com/jakearchibald/idb) exist to delete.

### 4 · Cache API — whole HTTP responses

The only storage that holds a **response** rather than a value: status line, headers and body,
keyed by the request that produced it. **Fetch & cache the mini-site** runs `cache.addAll()` over
four URLs; click an entry in DevTools → Cache Storage and you get the headers, not just bytes.

**The payoff step.** Press **Register service worker**, then set Network throttling to **Offline**,
then open [`/mini-site/`](http://localhost:5180/mini-site/). It loads. Stop the server with `Ctrl+C`
and it still loads. The page prints where it came from, so you can watch the status line change from
*served straight from the server* to *every byte came out of the Cache API*.

The division of labour is the thing to take away: the Cache API is only storage — it never
intercepts anything. The service worker in `mini-site/sw.js` is what sits between the page and the
network and decides to answer from storage instead. Cache API without a service worker is a box you
fill by hand; together they are what makes a website work on a plane.

Press **Unregister & delete** and reload to get back to a normal page.

## Files

```
server/index.mjs        static server + /api/set-cookies, /api/whoami, /api/clear-cookies
public/index.html       the four panels and their instructions
public/app.js           every action, one section per storage system
public/styles.css       presentation only, nothing to learn here
public/mini-site/       the four-file site that panel 4 fetches and caches
public/mini-site/sw.js  cache-first service worker, scoped to /mini-site/
```

## Two things that are true of all four

**They are partitioned by origin.** Every panel in DevTools lists storage under an origin heading,
and `github.com` cannot read `google.com`'s row. That isolation is not a convention — it is enforced
at the storage layer, which is the same-origin policy made physical.

**They can be evicted.** Under disk pressure the browser may clear storage for origins you have not
visited recently. `navigator.storage.persist()` asks it not to; whether the request is granted
depends on how much you appear to use the site. Nothing here is a guarantee, which is why none of
these is a substitute for a server.

## Reset

Everything the demo writes can be undone from the page itself — each panel has its own clear button.
For a clean slate, DevTools → Application → **Storage** → *Clear site data* wipes all four at once,
plus the service worker registration.
