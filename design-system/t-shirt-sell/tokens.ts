/**
 * Loom — design tokens for the t-shirt-sell app.
 *
 * Same file shape as Pepper (design-system/food-sell/tokens.ts), completely
 * different answers. That is the point worth noticing: the *structure* of a
 * design system is generic, the *decisions* are not.
 *
 * Colours are hex, not oklch, because React Native only understands hex.
 * `web/tokens.css` is a hand-written mirror of this file.
 */

/* ------------------------------------------------------------------ *
 * Tier 1 — primitives.
 * Raw values with no meaning attached. Components never use these
 * directly; they exist so the semantic tier has something to point at.
 * ------------------------------------------------------------------ */

const palette = {
  white: '#FFFFFF',

  // Pure, cool neutrals. The product photography supplies all the colour,
  // so the interface deliberately supplies none.
  ink0: '#FFFFFF',
  ink50: '#F7F7F7',
  ink100: '#EDEDED',
  ink200: '#D6D6D6',
  ink300: '#B5B5B5',
  ink500: '#6E6E6E',
  ink700: '#3D3D3D',
  ink900: '#111111',

  // The only saturated colour in the system, reserved for one job.
  sale: '#A0261A',

  moss600: '#2F6F4F',
} as const

/* ------------------------------------------------------------------ *
 * Tier 2 — semantic.
 * What the value is *for*. This is the layer components import, and the
 * only layer you swap to reskin the app.
 * ------------------------------------------------------------------ */

export const color = {
  bg: palette.ink0,
  surface: palette.ink0,
  surfaceMuted: palette.ink50,
  border: palette.ink200,
  borderStrong: palette.ink900,

  text: palette.ink900,
  textMuted: palette.ink500,

  // The brand *is* black. There is no brand hue to protect, so emphasis has
  // to come from weight, spacing and type instead of colour.
  brand: palette.ink900,
  brandHover: palette.ink700,
  brandFg: palette.ink0,
  brandSubtle: palette.ink100,

  // Domain tokens. Merchandising states are the only place colour is spent.
  price: palette.ink900,
  priceCompare: palette.ink500,
  sale: palette.sale,
  inStock: palette.moss600,
  soldOut: palette.ink300,

  disabled: palette.ink100,
  disabledFg: palette.ink300,
} as const

/** Same 4px scale as Pepper — but components here reach for the larger steps. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const

/** Near-square. Sharp corners are what make it read as a shop rather than an app. */
export const radius = {
  sm: 2,
  md: 4,
  lg: 6,
  full: 999, // colour swatches only
} as const

export const font = {
  family: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  size: { xs: 11, sm: 13, base: 15, lg: 18, xl: 24, xxl: 32 },
  weight: { regular: '400', medium: '500', bold: '600' },
  lineHeight: { tight: 1.15, normal: 1.5 },
  /** Small uppercase labels are the house voice: sizes, tags, buttons. */
  tracking: { label: 0.08, normal: 0 },
} as const

/**
 * No shadows anywhere. Elevation is expressed with a 1px border, which is a
 * decision, not an omission — it is why the pages feel flat and print-like.
 */
export const shadow = null

export const tapTarget = 44
