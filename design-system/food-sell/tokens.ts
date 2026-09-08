/**
 * Pepper — design tokens for the food-sell app.
 *
 * This file is the single source of truth. Every value a component is allowed
 * to use lives here.
 *
 * Colours are hex, not oklch, because React Native only understands hex. A
 * shared token layer has to speak the format every platform can read — that
 * constraint is real and it decides the format for you.
 *
 * `web/tokens.css` is a hand-written mirror of this file. In a large system
 * Style Dictionary generates it; at this size, syncing by hand is cheaper than
 * owning a build step.
 */

/* ------------------------------------------------------------------ *
 * Tier 1 — primitives.
 * Raw values with no meaning attached. Components never use these
 * directly; they exist so the semantic tier has something to point at.
 * ------------------------------------------------------------------ */

const palette = {
  white: '#FFFFFF',

  // Warm neutrals. A food app should not feel like a spreadsheet, so even
  // the greys carry a little red in them.
  sand50: '#FAF8F6',
  sand100: '#F1EDEA',
  sand200: '#E2DBD6',
  sand400: '#A39992',
  sand600: '#6B615B',
  sand900: '#221E1B',

  tomato50: '#FFF1EE',
  tomato100: '#FFE0D8',
  tomato500: '#F0512B',
  tomato600: '#D63F1B',

  chili600: '#C2371B',
  chili50: '#FDECE8',

  leaf500: '#2E9E5B',
  leaf50: '#E6F5EC',

  honey500: '#E8A317',
  honey50: '#FDF3E0',

  alert600: '#B3261E',
} as const

/* ------------------------------------------------------------------ *
 * Tier 2 — semantic.
 * What the value is *for*. This is the layer components import, and the
 * only layer you swap to reskin the app.
 * ------------------------------------------------------------------ */

export const color = {
  bg: palette.sand50,
  surface: palette.white,
  surfaceMuted: palette.sand100,
  border: palette.sand200,

  text: palette.sand900,
  textMuted: palette.sand600,

  brand: palette.tomato500,
  brandHover: palette.tomato600,
  brandFg: palette.white,
  brandSubtle: palette.tomato50,

  // Domain tokens. Every menu item is tagged, so the tags get names of
  // their own rather than each card picking a green it likes.
  veg: palette.leaf500,
  vegSubtle: palette.leaf50,
  spicy: palette.chili600,
  spicySubtle: palette.chili50,
  popular: palette.honey500,
  popularSubtle: palette.honey50,

  price: palette.sand900,
  discount: palette.tomato600,

  danger: palette.alert600,
  disabled: palette.sand200,
  disabledFg: palette.sand400,
} as const

/** 4px scale. Nothing in the UI is allowed to sit between these steps. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const

/** Generous and round — the decision that makes the whole app read as friendly. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const

export const font = {
  family: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, xxl: 28 },
  weight: { regular: '400', medium: '500', bold: '700' },
  lineHeight: { tight: 1.2, normal: 1.5 },
} as const

/** Soft, low shadows. Cards lift off the warm background rather than sit in boxes. */
export const shadow = {
  card: { color: palette.sand900, opacity: 0.08, blur: 12, offsetY: 2, elevation: 2 },
} as const

/** Ordering happens one-handed on a phone. 44px is the floor for anything tappable. */
export const tapTarget = 44
