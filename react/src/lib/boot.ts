/* ==========================================================================
   Proof that the page never reloads.
   --------------------------------------------------------------------------
   Module-level code runs once, when the browser first evaluates the bundle.
   If you navigate around this site and these values never change, then the
   browser never threw the JavaScript away and started over — which is the
   entire definition of a Single Page Application.

   Reload with F5 and they all change. That is the difference the SPA lesson
   is pointing at.
   ========================================================================== */

export const BOOT_AT = new Date()

/** A random id minted once per real page load. */
export const BOOT_ID = Math.random().toString(36).slice(2, 8).toUpperCase()

let navigations = 0

export function recordNavigation() {
  navigations += 1
}

export function navigationCount() {
  return navigations
}

export function uptimeSeconds() {
  return Math.round((Date.now() - BOOT_AT.getTime()) / 1000)
}
