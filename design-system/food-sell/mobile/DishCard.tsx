import { Image, StyleSheet, Text, View } from 'react-native'
import { color, font, radius, shadow, space } from '../tokens'
import { Badge } from './Badge'
import { Button } from './Button'

/**
 * Mirror of web/dish-card.tsx, and the clearest example of the split: the
 * *decisions* are identical (image left, price top-right, tags bottom-left,
 * Add button bottom-right, two-line description) while the *implementation*
 * shares nothing — flexbox defaults differ, there is no line-clamp, shadows
 * need two APIs.
 *
 * A design system does not promise shared code. It promises the same product.
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
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function DishCard({ name, description, price, imageUrl, tags = [], soldOut, onAdd }: Props) {
  return (
    <View style={[styles.card, soldOut && styles.soldOut]}>
      <Image source={{ uri: imageUrl }} style={styles.image} />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.price}>{money(price)}</Text>
        </View>

        {/* numberOfLines is RN's line-clamp — same decision, different API */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            {soldOut ? (
              <Badge tone="soldout">Sold out</Badge>
            ) : (
              tags.map((tag) => (
                <Badge key={tag} tone={tag}>
                  {tag}
                </Badge>
              ))
            )}
          </View>

          <Button label="Add" size="sm" disabled={soldOut} onPress={onAdd} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space[4],
    padding: space[4],
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    // iOS reads these four; Android reads elevation. One token, two consumers.
    shadowColor: shadow.card.color,
    shadowOpacity: shadow.card.opacity,
    shadowRadius: shadow.card.blur,
    shadowOffset: { width: 0, height: shadow.card.offsetY },
    elevation: shadow.card.elevation,
  },
  soldOut: { opacity: 0.6 },
  image: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: color.surfaceMuted },
  body: { flex: 1, gap: space[2] },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[3] },
  name: { flex: 1, fontSize: font.size.lg, fontWeight: font.weight.medium, color: color.text },
  price: { fontSize: font.size.base, fontWeight: font.weight.medium, color: color.price },
  description: { fontSize: font.size.sm, color: color.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  tags: { flexDirection: 'row', gap: space[1] },
})
