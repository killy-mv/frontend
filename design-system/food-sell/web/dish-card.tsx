import { Badge } from './badge'
import { Button } from './button'
import { cn } from './cn'

/**
 * One row of the menu. This is a *pattern*, not a primitive: it is built out of
 * Button and Badge and adds no new colours of its own. If you find yourself
 * reaching for a hex code in a file like this, the token layer is missing
 * something.
 */
type Props = {
  name: string
  description: string
  /** Minor units (cents), so no float ever touches money. */
  price: number
  imageUrl: string
  tags?: Array<'veg' | 'spicy' | 'popular'>
  soldOut?: boolean
  onAdd?: () => void
  className?: string
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function DishCard({
  name,
  description,
  price,
  imageUrl,
  tags = [],
  soldOut,
  onAdd,
  className,
}: Props) {
  return (
    <article
      className={cn(
        'flex gap-4 rounded-lg bg-surface p-4 shadow-card',
        soldOut && 'opacity-60',
        className,
      )}
    >
      <img
        src={imageUrl}
        alt=""
        className="h-24 w-24 shrink-0 rounded-md object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium">{name}</h3>
          <span className="shrink-0 text-base font-medium text-price">{money(price)}</span>
        </div>

        {/* line-clamp, because the card has to survive a 200-character description */}
        <p className="line-clamp-2 text-sm text-text-muted">{description}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {soldOut ? (
              <Badge tone="soldout">Sold out</Badge>
            ) : (
              tags.map((tag) => (
                <Badge key={tag} tone={tag}>
                  {tag}
                </Badge>
              ))
            )}
          </div>

          <Button size="sm" disabled={soldOut} onClick={onAdd}>
            Add
          </Button>
        </div>
      </div>
    </article>
  )
}
