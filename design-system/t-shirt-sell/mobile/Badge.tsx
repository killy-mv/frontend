import { StyleSheet, Text, View } from 'react-native'
import { color, font, radius, space } from '../tokens'

/** Mirror of web/badge.tsx — same three tones, same token names. */
type Props = {
  children: string
  tone?: keyof typeof tones
}

const tones = {
  new: { bg: color.brand, fg: color.brandFg },
  sale: { bg: color.sale, fg: color.brandFg },
  soldout: { bg: color.surfaceMuted, fg: color.textMuted },
} as const

export function Badge({ children, tone = 'new' }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: tones[tone].bg }]}>
      <Text style={[styles.label, { color: tones[tone].fg }]}>{children.toUpperCase()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  label: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    letterSpacing: font.size.xs * font.tracking.label,
  },
})
