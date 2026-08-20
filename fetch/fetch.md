# fetch

## What it actually is
- `fetch()` is the browser's built-in way to make an HTTP request from JavaScript. It's not part of the JS language — there's no `fetch` in the spec for the language itself. It's an API the *host environment* hands you, defined by the WHATWG Fetch standard, and implemented by browsers, Node (since 18), Deno, Bun, and Cloudflare Workers alike. Same function signature everywhere, slightly different capabilities in each.
- It replaced `XMLHttpRequest` as the default. XHR still exists and still works, and it can still do one thing fetch can't (upload progress), but everything else about it — the event-based API, the four-state `readyState` machine, the ceremony of `open`/`setRequestHeader`/`send` — belongs to an earlier era.
- The mental model: **fetch is a thin, honest wrapper over HTTP.** It doesn't hide status codes, it doesn't guess what your body is, it doesn't retry, and it doesn't decide that a 500 is a failure. It gives you the response the server actually sent and lets you interpret it. Almost every surprise about fetch comes from expecting it to be more opinionated than it is.

```js
const res = await fetch('/api/users')
const users = await res.json()
```

- Two awaits, always. The first resolves when the **response headers** arrive — status, headers, and nothing else. The second resolves when the **body** has been read to the end. That split is the single most important structural fact about the API, and most of the rest of this file follows from it.

## The promise resolves on 404. This is on purpose.
- `fetch` rejects only when the request never produced an HTTP response: DNS failure, connection refused, the network dropped, CORS blocked it, the request was aborted. A 404, a 401, a 500 — those are *successful* round trips. The server was asked a question and answered it. The answer was just "no".
- So the naive version is silently broken:

```js
// wrong: this treats a 500 as success
const res = await fetch('/api/users')
const users = await res.json()   // throws an opaque JSON parse error on an HTML error page
```

- The check is `res.ok` (true for status 200–299), and it belongs in one place, not sprinkled through every call site:

```js
async function request(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.text()          // read it — error responses have bodies too
    throw new HttpError(res.status, body)
  }
  return res
}
```

- Why the spec chose this: fetch models HTTP, and in HTTP a 404 is a legitimate reply. Rejecting on it would mean the API has an opinion about which status codes count as errors — and applications disagree. `409 Conflict` is an error to one app and expected control flow to another. Leaving the judgment to you is the more honest design, even though it costs an `if` in every wrapper.
- Practical consequence: **you cannot distinguish "network died" from "server said no" by catching alone.** A `catch` around fetch catches TypeErrors from the transport layer; the HTTP-level failures come through the resolved path. A wrapper that converts non-`ok` into a thrown `HttpError` reunites them, which is usually what you want — but do it deliberately, and keep the status on the error object.

## The body is a stream, and you get one pass
- `Response` doesn't hold a string. It holds a `ReadableStream`, and `.json()`, `.text()`, `.blob()`, `.arrayBuffer()`, `.formData()` are all *consumers* that drain it. Once drained, it's gone — `res.bodyUsed` flips to `true` and a second read throws.

```js
const res = await fetch(url)
const a = await res.json()
const b = await res.text()   // TypeError: body stream already read
```

- This bites hardest in error handling and logging middleware: you read `res.json()` to get the payload, then something else downstream wants `res.text()` for a log line, and it fails. The fix is `res.clone()` **before** the first read (clone after reading is too late), or read once into a variable and pass the value around instead of the response.
- The upside of streams: you don't have to buffer. For a large download or a token-by-token LLM response, you read chunks as they land:

```js
const res = await fetch('/api/stream')
const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  render(value)                 // arrives progressively
}
```

- Download progress works the same way: read chunks, sum their `.length`, compare against the `Content-Length` header. Upload progress does **not** — see below.

## Sending a request
- Everything beyond the URL lives in the second argument. The defaults are: `GET`, no body, `same-origin` credentials, `cors` mode, browser-managed cache.

```js
await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Ada' }),
  credentials: 'include',
  signal: controller.signal,
})
```

- **`body` accepts more than strings** — `FormData`, `URLSearchParams`, `Blob`, `File`, `ArrayBuffer`, and `ReadableStream` all work. Fetch infers `Content-Type` from the type you pass, and that inference is usually right.
- **The classic FormData mistake** is setting the header yourself. `multipart/form-data` requires a boundary token in the header that has to match the one in the body; the browser generates both when you leave the header alone. Set `Content-Type: multipart/form-data` manually and you send it without a boundary, and the server can't parse anything.

```js
// right — no Content-Type header at all
await fetch('/upload', { method: 'POST', body: formData })
```

- **`headers` can be a plain object or a `Headers` instance.** The `Headers` class is worth knowing because it's case-insensitive and has `.append()` for repeated headers (`Set-Cookie`, multiple `Accept`s). Some headers are *forbidden* — `Host`, `Origin`, `Referer`, `Cookie`, `Content-Length` and friends are controlled by the browser and silently ignored if you try to set them. That's a security property, not a bug: it stops a page from forging where a request appears to come from.
- **`GET` and `HEAD` cannot have a body.** Fetch throws if you try. If you need to send a complex query, either encode it into the URL (`URLSearchParams`) or use POST — the "GET with a JSON body" pattern some APIs want is not expressible here.

## Same-origin, CORS, and why the error is so unhelpful
- The browser enforces the same-origin policy on fetch. A request to a different origin is allowed to *leave*, but the response is only readable if the server opts in with `Access-Control-Allow-Origin`. Fetch rejects with a bare `TypeError: Failed to fetch` and no detail — deliberately, because a descriptive error would itself leak information about the other origin.
- The tell: the request is visible in the Network tab, often with a `200`, and the JS still fails. **A CORS failure is a browser decision made after the response arrives, not a server error.** Nothing on the frontend can fix it; the header has to come from the server.
- Non-simple requests (any method beyond GET/POST/HEAD, or custom headers like `Authorization`) trigger a **preflight** — an automatic `OPTIONS` request the browser sends first to ask permission. This is why "it works in Postman" is such a common false signal: Postman isn't a browser and doesn't preflight or enforce any of this.
- **`credentials`** controls cookies. `same-origin` is the default; cross-origin cookies need `credentials: 'include'` *and* the server must send `Access-Control-Allow-Credentials: true` and a specific origin (the wildcard `*` is rejected when credentials are involved). This is the pairing behind most "the cookie isn't being sent" debugging sessions.
- **`mode: 'no-cors'`** is not the escape hatch it sounds like. It suppresses the error by giving you an *opaque* response: status 0, no headers, unreadable body. It's for fire-and-forget cases and cache warming, and it is never the fix for a CORS problem you actually need data from.

## Cancellation is `AbortController`
- Fetch has no `.cancel()`. Cancellation comes from a separate primitive — you create a controller, pass its `signal` into the request, and call `abort()` when you want out. The promise then rejects with an `AbortError`.

```js
const controller = new AbortController()
fetch(url, { signal: controller.signal })
controller.abort()
```

- An abort is not an error worth reporting to the user, so filter it — otherwise cancelling a search request paints an error toast on the screen:

```js
catch (err) {
  if (err.name === 'AbortError') return
  showError(err)
}
```

- **Fetch has no timeout.** There's no `timeout` option; the promise waits as long as the browser's own connection limits allow, which can be minutes. `AbortSignal.timeout(ms)` is the built-in answer now, and `AbortSignal.any([...])` combines it with a manual controller when you need both:

```js
const signal = AbortSignal.any([
  controller.signal,               // user navigated away
  AbortSignal.timeout(10_000),     // took too long
])
```

- The two most valuable uses in a UI: **cancel the in-flight request when a component unmounts** (otherwise you set state on something that's gone), and **cancel the previous request when a new one supersedes it** (type-ahead search, where request 3 must not be overwritten by a slow request 2 arriving late).

## Fetch in a component, and the race nobody sees in dev
- The bare version inside `useEffect` looks fine and is wrong in three ways: it races, it leaks, and it has no loading or error state.

```js
useEffect(() => {
  const controller = new AbortController()
  fetch(`/api/search?q=${q}`, { signal: controller.signal })
    .then(res => res.json())
    .then(setResults)
    .catch(err => { if (err.name !== 'AbortError') setError(err) })
  return () => controller.abort()      // the important line
}, [q])
```

- The cleanup function is what makes this correct. Without it, typing "abc" fires three requests and the UI shows whichever *finishes* last, not whichever was asked last — and on a slow connection those differ often enough to be a real bug that never reproduces on localhost.
- Beyond that, hand-rolled fetching in components means re-implementing caching, deduplication, revalidation, retries, and pagination once per app. That's the case for TanStack Query, SWR, or a router's data loader — none of them replace fetch, they wrap it and own the lifecycle around it. **Fetch is the transport; those are the state management.** Learn fetch properly first, because every one of those libraries eventually makes you configure the thing underneath.

## Retries, idempotency, and the thing that makes retries dangerous
- Fetch never retries. If you add it, only retry what's safe to repeat: `GET`, `HEAD`, `PUT`, `DELETE` are idempotent by definition; `POST` is not. A retried `POST /orders` after a timeout can create two orders, because a timeout doesn't tell you whether the server processed the first one — only that you didn't hear back.
- Retry on network errors, `408`, `429`, and `5xx`. Never on `4xx` other than those two: a `400` will be a `400` forever, and retrying it just multiplies the load.
- Back off exponentially with jitter. Fixed-interval retries from thousands of clients synchronize into a thundering herd against a server that's already struggling. And honour `Retry-After` when a `429` sends one — the server is telling you exactly what it wants.

## Things fetch can't do, and what to reach for instead
- **Upload progress.** The request body isn't observable, so there's no `onprogress` for uploads. `XMLHttpRequest.upload.onprogress` remains the only cross-browser way to draw a real upload bar. (Request streaming exists in Chromium with `duplex: 'half'`, but it's not portable yet.) This is the one honest reason to still write XHR in 2026.
- **Server push / long-lived subscriptions.** Streaming a fetch response works and is how SSE-shaped LLM APIs are consumed, but `EventSource` gives you automatic reconnection and event IDs for free, and WebSockets give you a bidirectional channel. Fetch is request/response at heart.
- **Surviving page unload.** A fetch fired in `beforeunload` or `visibilitychange` is usually killed mid-flight. `keepalive: true` lets a small request (≤64KB) outlive the page, which is what `navigator.sendBeacon()` does under the hood — the right tool for analytics on exit.
- **Interceptors.** No built-in hook for "run this before every request". This is the main ergonomic gap versus axios, and the reason nearly every codebase grows its own `api.ts` wrapper: base URL, auth header, `res.ok` check, JSON parsing, timeout, error normalization. Writing that file once is a rite of passage and genuinely the right move — it's about forty lines and you understand all of them, which is not true of the dependency it replaces.

## The mental model to keep
- Fetch resolves when the server answers, whatever the answer was. Checking `res.ok` is your job, not its.
- Two awaits: headers, then body. The body is a one-shot stream — clone it or read it once.
- The browser owns what you're allowed to do: forbidden headers, CORS, credentials, preflights. Those failures are decisions, not bugs, and they're fixed on the server.
- Cancellation, timeouts, retries, and caching are all *outside* the API by design. You bring them, in one wrapper, at one layer — never at the call site.
