import { cn } from './cn'

/**
 * The variant map is the design system in miniature: four buttons exist, so a
 * fifth cannot quietly appear because someone was in a hurry. TypeScript
 * rejects `variant="blue"` before it reaches a review.
 *
 * Note what is *not* here: no colour props, no size in pixels. Appearance is a
 * closed menu. Behaviour (`onClick`, `type`, `disabled`, `aria-*`) is wide open
 * and passes straight through to the real <button>.
 */
const variants = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
  secondary: 'bg-brand-subtle text-brand hover:bg-surface-muted',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:brightness-95',
} as const

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base', // 44px — the tap-target floor from tokens.ts
  lg: 'h-13 px-6 text-lg',
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
        'inline-flex items-center justify-center gap-2 rounded-full font-medium',
        'transition-colors cursor-pointer',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-fg disabled:hover:bg-disabled',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
