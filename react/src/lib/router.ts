/* ==========================================================================
   The whole router. Forty lines, no dependency.
   --------------------------------------------------------------------------
   This site is a Single Page Application: the browser loads index.html exactly
   once, and from then on "changing page" means React rendering a different
   component into the same <div id="root">. Something has to decide *which*
   component, and that something is this file.

   It uses the hash (`#/state`) rather than the real path (`/state`) for one
   reason: the hash never reaches the server, so `npm run build` output works
   from a plain static host — or straight off the disk — with no rewrite rules.
   A real app would use the History API and configure the server to serve
   index.html for every path.
   ========================================================================== */

import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function read() {
  // "#/state" -> "state", "" or "#/" -> ""
  return window.location.hash.replace(/^#\/?/, '')
}

/**
 * Subscribe this component to the URL.
 *
 * `useSyncExternalStore` is React's official way to read a value that lives
 * *outside* React — here, `window.location`. Give it a way to subscribe and a
 * way to read, and React re-renders the component whenever the value changes,
 * without tearing during concurrent rendering. Doing this with
 * `useState` + `useEffect` is the common hand-rolled version, and it is subtly
 * wrong: the first render can read a hash that has already changed.
 */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, read)
}

export function href(slug: string): string {
  return slug ? `#/${slug}` : '#/'
}

export function go(slug: string) {
  window.location.hash = href(slug)
}
