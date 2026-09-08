/**
 * Joins class names and drops falsy ones.
 *
 * Real systems use `clsx` + `tailwind-merge` here. tailwind-merge matters once
 * callers start passing a `className` that conflicts with the component's own
 * (`px-6` against a built-in `px-4`) — without it the winner is whichever
 * Tailwind emitted last, which is a coin flip. Until that bites, this is enough.
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
