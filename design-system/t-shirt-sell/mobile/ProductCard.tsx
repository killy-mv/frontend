import { Image, StyleSheet, Text, View } from 'react-native'
import { color, font, radius, space } from '../tokens'
import { Badge } from './Badge'

/**
 * Mirror of web/product-card.tsx: tall 3:4 image, one badge, price with an
 * optional strike-through compare-at, colour swatches underneath.
 *
 * No shadow anywhere, matching `shadow = null` in tokens.ts. On mobile that
 * omission is easy to break by accident — RN cards default to looking flat, so
 * a developer adds `elevation: 2` to "fix" it and the system quietly drifts.
 * The token being explicitly null is the note saying: this is intentional.
 */
type Props = {
  name: string
  /** Minor units (cents), so no float ever touches money. */
  price: number
  compareAtPrice?: number
  imageUrl: string
  /** Hex values straight from product data, not tokens: this is content, not UI. */
  swatches?: string[]
  soldOut?: boolean
  isNew?: boolean
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
}: Props) {
  const onSale = compareAtPrice != null && compareAtPrice > price

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={[styles.image, soldOut && styles.imageSoldOut]} />

        <View style={styles.badges}>
          {soldOut ? (
            <Badge tone="soldout">Sold out</Badge>
          ) : onSale ? (
            <Badge tone="sale">Sale</Badge>
          ) : isNew ? (
            <Badge tone="new">New</Badge>
          ) : null}
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={[styles.price, onSale && styles.priceOnSale]}>{money(price)}</Text>
        {onSale && <Text style={styles.compareAt}>{money(compareAtPrice)}</Text>}
      </View>

      {swatches.length > 0 && (
        <View style={styles.swatches}>
          {swatches.map((hex) => (
            <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
  imageWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: color.surfaceMuted,
  },
  image: { width: '100%', aspectRatio: 3 / 4 },
  imageSoldOut: { opacity: 0.6 },
  badges: { position: 'absolute', top: space[2], left: space[2] },
  name: { fontSize: font.size.base, color: color.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  price: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: color.price },
  priceOnSale: { color: color.sale },
  compareAt: {
    fontSize: font.size.xs,
    color: color.priceCompare,
    textDecorationLine: 'line-through',
  },
  swatches: { flexDirection: 'row', gap: space[1] + 2 },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.border,
  },
})
