import { cn } from './cn'

/**
 * − 1 + . The domain-specific control: a food app is mostly a list of things
 * you adjust the count of, so this earns a place in the shared layer even
 * though no general-purpose library would ship it.
 *
 * It is a controlled component — it owns no state, only the rules (never below
 * `min`, never above `max`). Where the number actually lives is the cart's
 * problem, not the design system's.
 */
type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

const step =
  'flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none ' +
  'text-brand transition-colors hover:bg-brand-subtle ' +
  'disabled:cursor-not-allowed disabled:text-disabled-fg disabled:hover:bg-transparent'

export function QuantityStepper({ value, onChange, min = 0, max = 99, className }: Props) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Remove one"
        className={step}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>

      {/* aria-live so a screen reader announces the new count without moving focus */}
      <span aria-live="polite" className="min-w-6 text-center text-base font-medium tabular-nums">
        {value}
      </span>

      <button
        type="button"
        aria-label="Add one"
        className={step}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
