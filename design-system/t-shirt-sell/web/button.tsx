import { cn } from './cn'

/**
 * Compare this file with food-sell/web/button.tsx — same structure, different
 * decisions all the way down. Square corners instead of pills, uppercase
 * letter-spaced labels, an `outline` variant instead of a tinted `secondary`,
 * and no `danger` at all (nothing destructive happens in a shop).
 *
 * A variant you never use is a variant that rots. Deleting `danger` is a
 * design decision, not an oversight.
 */
const variants = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
  outline: 'border border-border-strong bg-transparent text-text hover:bg-surface-muted',
  ghost: 'bg-transparent text-text-muted hover:text-text',
} as const

const sizes = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm', // 44px — the tap-target floor from tokens.ts
  lg: 'h-14 px-8 text-sm',
} as const

type Props = React.ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  block?: boolean
}

export function Button({ variant = 'primary', size = 'md', block, className, ...props }: Props) {
  return (
    <button
      className={cn(
        // uppercase + tracking is the house voice, applied here once so no
        // caller has to remember it
        'inline-flex items-center justify-center gap-2 rounded-sm font-medium uppercase tracking-label',
        'transition-colors cursor-pointer',
        'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-disabled-fg',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
