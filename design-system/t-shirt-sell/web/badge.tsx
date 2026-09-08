import { cn } from './cn'

/**
 * Merchandising labels. Three tones, because colour is scarce in this system
 * and every one spent has to earn it: `sale` is the only saturated colour in
 * the whole app, so it always means the same thing.
 */
const tones = {
  new: 'bg-brand text-brand-fg',
  sale: 'bg-sale text-white',
  soldout: 'bg-surface-muted text-text-muted',
} as const

type Props = React.ComponentProps<'span'> & {
  tone?: keyof typeof tones
}

export function Badge({ tone = 'new', className, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium uppercase tracking-label',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
