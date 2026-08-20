# Authentication on the frontend

## The premise: none of this is security
- Everything the frontend does about auth is UI logic. Route guards, hidden buttons, redirects to `/login`, "you are not allowed" screens — all of it is arrangement of components, and all of it runs on a machine the user controls. They can open devtools and flip a boolean in the store, type the protected URL directly, call the API from the console with `fetch`, replay a request from the Network tab, or skip the browser entirely and use curl. Nothing shipped to the browser can be trusted, because the user is the one running it.
- So the real boundary is the server. Every endpoint has to independently answer "who is this, and are they allowed to do this?" on every single request, as if no frontend existed. The frontend's guards are a convenience layer on top of that answer, never a substitute for it.
- The useful way to hold it: **the server decides, the frontend reacts.** Frontend auth is the art of reacting well — not flashing the wrong screen, not leaking data into a stale cache, not firing five refresh calls at once, not dumping the user back to the homepage after they log in.

## What the frontend is actually responsible for
- **Collecting credentials** — the login form, the OAuth redirect, the OTP input. Pure UI work, but the surface where most UX pain lives (validation, error messaging, loading states, password managers, `autocomplete` attributes).
- **Holding the proof** — a token in memory, or nothing at all if the session lives in an `HttpOnly` cookie.
- **Attaching it to every request** — automatic with cookies, an interceptor with bearer tokens.
- **Reacting to the answer** — 401 means refresh or log out, 403 means show the "not allowed" state, 200 means render.
- **Managing the session lifecycle** — refresh before expiry, logout, sync across tabs.

## Auth state is a state machine, not a boolean
- The mistake is modelling it as `isLoggedIn: boolean`, because on a page reload the app doesn't know yet — it has to ask the server (`GET /me` or `POST /refresh`) and that takes a moment. With a boolean, that moment renders as `false`, so the user sees a flash of the login page on every refresh before being thrown back to where they were.
- Three states minimum: `loading | authenticated | anonymous`. `loading` renders a skeleton or nothing at all. Only `anonymous` redirects.

```
status = 'loading'   → render nothing / skeleton, never redirect
status = 'authed'    → render app
status = 'anonymous' → redirect to /login?next=<current path>
```

- Keep it in one place — a context, a store, a router loader — and derive everything else from it. Auth state scattered across components is how you end up with one part of the UI thinking the user is logged in and another thinking they aren't.

## Route guards are redirects, not locks
- A client-side guard is a component that looks at auth state and calls `navigate('/login')`. That is the whole mechanism. The route's code was already downloaded in the bundle, and the user can reach it by editing state or disabling the guard. It stops *accidents*, not *attempts*.
- What it genuinely buys: the user lands on `/dashboard` with no session and gets a login screen instead of a broken page full of failed requests. That is a real improvement, and it is a UX improvement.
- Always preserve the destination — `/login?next=/settings/billing` — and return them there after login. Losing deep links is one of the most common auth UX failures.
- Server-rendered guards (Next.js middleware, Astro middleware, Remix loaders) are different in kind: the check runs before any HTML is sent, so the protected data never reaches the browser. That is an actual boundary, because it happens on the server. Client route guards only hide what is already there.

## Conditional rendering hides discovery, not capability
- Hiding the "Delete user" button from non-admins is good UX: it keeps the interface honest about what this person can do. It is not access control. The endpoint still exists, and anyone who knows its shape can call it.
- The rule that follows: **every conditional render needs a matching server-side authorization check.** If the button is hidden because `user.role !== 'admin'`, then `DELETE /users/:id` must reject non-admins too. The frontend condition and the backend condition are two expressions of the same rule, and the backend one is the one that matters.
- Corollary: don't send data to the client you intend to hide with CSS or a conditional. If the API returns every user's salary and the UI only renders it for managers, the salaries are in the network response and one devtools tab away.

## Attaching credentials
- **Cookie sessions** — the browser does it for you. Nothing to store, nothing readable by JS (`HttpOnly`), so XSS can't steal the session. Cross-origin requests need `credentials: 'include'`, and because cookies ride along automatically from anywhere, you need CSRF protection (`SameSite=Lax` covers most of it, plus a CSRF token for state-changing requests).
- **Bearer tokens** — one interceptor that puts `Authorization: Bearer <token>` on every request and handles the 401 path. Scattering this logic across components is how refresh bugs are born.
- **Storage tradeoff** — `localStorage` is readable by any script on the page, so an XSS becomes a permanent account takeover. In-memory is safest but dies on reload, so you re-hydrate with a `/refresh` call on boot. The common good answer: access token in memory, refresh token in an `HttpOnly` cookie.

## The refresh dance
- Access tokens are short-lived on purpose, so expiry is a normal event, not an error. Five requests in flight will all get 401 at once, and the naive interceptor fires five refresh calls — which race, and four of them fail against a rotated refresh token, logging the user out mid-session.
- The fix is **single-flight**: the first 401 starts the refresh and stores the promise; every other 401 awaits that same promise and then retries its original request.

```js
let refreshing = null
async function onUnauthorized(request) {
  refreshing ??= refresh().finally(() => { refreshing = null })
  await refreshing
  return retry(request)
}
```

- Retry once. If the retry also fails, the session is genuinely gone — clear state and send them to login.

## Ending a session properly
- **Logout is not just clearing local state.** Call the server to revoke the refresh token, otherwise a stolen token stays valid until it expires on its own. Then clear memory, and clear the query/store cache — otherwise the next person to log in on that browser sees the previous user's cached data flash on screen.
- **Sync across tabs.** Logging out in one tab should log out the others. `BroadcastChannel('auth')` or the `storage` event, whichever fits.
- **Treat 401 as truth.** However confident local state is, a 401 from the server means the session is over. The server's answer always wins over what the frontend believes.

## The mental model to keep
- Frontend auth is choreography: showing the right screen, holding the right credential, asking again at the right moment, failing gracefully. It makes the product feel coherent and it prevents honest mistakes.
- It prevents nothing else. Assume every guard is bypassed, every hidden button is clicked, every protected URL is typed in directly — and then make sure the server would still say no. If the answer is yes, the security was never on the frontend to begin with.
