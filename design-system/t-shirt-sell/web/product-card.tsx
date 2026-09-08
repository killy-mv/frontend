import { Badge } from './badge'
import { cn } from './cn'

/**
 * One tile in a product grid. Compare with food-sell/web/dish-card.tsx: that
 * one is a horizontal row with an Add button, because ordering food is a list
 * you tick through. This one is a tall image with no button at all, because
 * buying a shirt means going to the product page first.
 *
 * Same layer of the system, opposite shape. The domain decides.
 */
type Props = {
  name: string
  /** Minor units (cents), so no float ever touches money. */
  price: number
  /** Original price when on sale — drives both the strike-through and the badge. */
  compareAtPrice?: number
  imageUrl: string
  /** Hex values straight from product data, not tokens: this is content, not UI. */
  swatches?: string[]
  soldOut?: boolean
  isNew?: boolean
  className?: string
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function ProductCard({
  name,
  price,
  compareAtPrice,
  imageUrl,
  swatches = [],
  soldOut,
  isNew,
  className,
}: Props) {
  const onSale = compareAtPrice != null && compareAtPrice > price

  return (
    <article className={cn('group flex flex-col gap-3', className)}>
      <div className="relative overflow-hidden rounded-md bg-surface-muted">
        <img
          src={imageUrl}
          alt={name}
          className={cn(
            'aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]',
            soldOut && 'opacity-60',
          )}
        />

        <div className="absolute left-2 top-2 flex gap-1">
          {soldOut && <Badge tone="soldout">Sold out</Badge>}
          {!soldOut && onSale && <Badge tone="sale">Sale</Badge>}
          {!soldOut && !onSale && isNew && <Badge tone="new">New</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base">{name}</h3>

        <div className="flex items-baseline gap-2">
          <span className={cn('text-sm font-medium', onSale ? 'text-sale' : 'text-price')}>
            {money(price)}
          </span>
          {onSale && (
            <span className="text-xs text-price-compare line-through">
              {money(compareAtPrice)}
            </span>
          )}
        </div>

        {swatches.length > 0 && (
          <div className="mt-1 flex gap-1.5">
            {swatches.map((hex) => (
              <span
                key={hex}
                // rounded-full is why radius.full exists in tokens.ts — swatches
                // are the one round thing in an otherwise square system
                className="h-3.5 w-3.5 rounded-full border border-border"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
