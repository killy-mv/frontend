import { cn } from './cn'

/**
 * Menu tags. The tones are named after the product's vocabulary, not after
 * colours — `tone="veg"`, never `color="green"`. That is what lets you change
 * every "veg" marker in the app by editing one token.
 */
const tones = {
  veg: 'bg-veg-subtle text-veg',
  spicy: 'bg-spicy-subtle text-spicy',
  popular: 'bg-popular-subtle text-popular',
  soldout: 'bg-surface-muted text-text-muted',
} as const

type Props = React.ComponentProps<'span'> & {
  tone?: keyof typeof tones
}

export function Badge({ tone = 'popular', className, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
