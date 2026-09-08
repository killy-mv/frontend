import { cn } from './cn'

/**
 * S M L XL. The domain-specific control, and the reason this app needs a design
 * system of its own: three states (available, selected, sold out) that have to
 * look identical on every product page, in the quick-add drawer and in the cart.
 *
 * Sold-out sizes are rendered and disabled, never hidden — a shopper needs to
 * see that their size exists and is gone, otherwise the page just looks wrong.
 *
 * It is radio-group semantics, not buttons: arrow keys move between options and
 * a screen reader announces "2 of 4 selected".
 */
type Size = { label: string; soldOut?: boolean }

type Props = {
  sizes: Size[]
  value?: string
  onChange: (label: string) => void
  className?: string
}

export function SizeSelector({ sizes, value, onChange, className }: Props) {
  return (
    <div role="radiogroup" aria-label="Size" className={cn('flex flex-wrap gap-2', className)}>
      {sizes.map(({ label, soldOut }) => {
        const selected = value === label

        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={soldOut}
            onClick={() => onChange(label)}
            className={cn(
              'h-11 min-w-11 rounded-sm border px-3 text-sm font-medium uppercase tracking-label transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              selected
                ? 'border-border-strong bg-brand text-brand-fg'
                : 'border-border bg-surface text-text hover:border-border-strong',
              // struck through, so "gone" survives being read in greyscale
              soldOut &&
                'cursor-not-allowed border-border text-sold-out line-through hover:border-border',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
