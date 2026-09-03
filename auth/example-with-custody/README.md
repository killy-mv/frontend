# Custody — where the proof lives between requests

The companion to the **custody** part of [`../auth.md`](../auth.md). `example-with-states` covered
choreography — the `loading | authenticated | anonymous` machine driven by buttons. This one drives
the same machine from a real server, and changes exactly one thing between modes: **what the browser
holds**.

```
npm install
npm run api    # both API servers, one process
npm run dev    # the app on http://localhost:5173
```

Log in with `ada@example.com` / `password`.

## The three cases

| Mode | Identity comes from | The browser holds | Custody code you write |
| --- | --- | --- | --- |
| **Same-site API** | your API, cookie session | nothing it can read | none |
| **Third-party API** | partner API, bearer token | an access token in memory | a token store + an interceptor |
| **Hybrid** | your API + a partner API | one credential, or two | depends on the BFF switch |

Switching modes reloads the page on purpose — the in-memory token only dies on reload, and leaving
one mode's credential alive while another runs would make the panel lie.

### 1. Same-site API — `src/custody/cookieSession.ts`

The API is proxied through Vite (`/api` → `:8787`), so the browser only ever talks to
`localhost:5173`. That makes it same-origin, and the custody code is **nothing**: no token, no
storage, no interceptor, nothing to forget to attach. The session is an `HttpOnly` cookie the app
cannot read, cannot leak, and cannot lose track of.

What it costs you instead is CSRF. Cookies ride along automatically from anywhere, including a form
on someone else's site, so `POST /api/notes` also demands an `x-csrf-token` header matching a second,
deliberately readable cookie. Try it — the demo's `POST` returns 403 without it.

Cross-origin but same-site (`app.example.com` → `api.example.com`) works the same way, with
`credentials: 'include'` and CORS added.

### 2. Third-party API — `src/custody/memoryToken.ts` + `partnerToken.ts`

The partner API is at `:8788`, called directly, cross-origin. It accepts only a bearer token — note
that sending it a cookie gets a 401, because a third-party API has no session with your user.

The access token lives in a **module-scoped variable**, deliberately not React state. A token in the
component tree shows up in React DevTools, in any state snapshot an error reporter serialises, and —
the classic accident — in `localStorage` the moment someone adds a persistence middleware.

Memory dies on reload, so boot calls `/oauth/refresh`, which is authorised by an `HttpOnly` cookie
scoped to `/oauth`. That call *is* the `loading` state.

The refresh is **single-flight** (`refreshPartnerSession`): the server rotates the refresh token, so
three parallel 401s each starting their own refresh would leave two holding a dead token and log the
user out mid-session. The token expires after 60 seconds — wait a minute, hit "Reload data", and
watch one refresh fire and the request retry once.

### 3. Hybrid — `src/custody/hybrid.ts`

Your API for identity, plus a partner API. The toggle on the dashboard is the actual lesson:

- **BFF on** — the browser sends only its session cookie; your server calls the partner with a key
  the browser never sees. One credential in the tab, and it is one the page cannot read.
- **BFF off** — the browser also holds a partner token. Two credentials, two revocations on logout,
  two things an injected script can reach.

Watch the "Requests" panel and the `seenBy` field flip between `service key (server-to-server)` and
`bearer token for ada@example.com`. The BFF version is what real apps converge on, and it is why
"just call the partner API from the frontend" is usually the wrong instinct.

## What to actually look at

- **The `document.cookie` panel.** That is precisely what an injected script can read. The session
  cookie is missing from it, and that absence is the entire security property. Compare with DevTools
  → Application → Cookies, which shows `HttpOnly` ones too.
- **The "Requests" panel.** Custody is invisible by design, so this names the credential that rode
  along with each call.
- **Reload the page in each mode.** Mode 1 restores from a cookie; mode 2 has to mint a new token
  from the refresh cookie. Both spend time in `loading`, which is why the state exists.
- **Stop `npm run api` and reload.** You get the error screen, not the login screen — a network
  failure is not the same as being logged out.

## What this demo is not

- **Not capture.** The login form is in this app's own DOM, so any script on the page can read it.
  Fixing that means a redirect, an iframe, or a passkey — see `auth.md`.
- **Not production cookie flags.** Everything here would also carry `Secure`; it is omitted only
  because the demo runs on `http://localhost`.
- **Not a real authorization story.** The server checks *who*, never *what they may do*.
- **Locally, the "third-party" API is cross-origin but still same-site** (both are `localhost`), so
  its refresh cookie is sent under `SameSite=Lax`. A genuinely cross-site API cannot rely on that —
  which is another reason the hybrid/BFF shape wins in practice.
