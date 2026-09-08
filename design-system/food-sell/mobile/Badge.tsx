import { StyleSheet, Text, View } from 'react-native'
import { color, font, radius, space } from '../tokens'

/** Mirror of web/badge.tsx — same four tones, same token names. */
type Props = {
  children: string
  tone?: keyof typeof tones
}

const tones = {
  veg: { bg: color.vegSubtle, fg: color.veg },
  spicy: { bg: color.spicySubtle, fg: color.spicy },
  popular: { bg: color.popularSubtle, fg: color.popular },
  soldout: { bg: color.surfaceMuted, fg: color.textMuted },
} as const

export function Badge({ children, tone = 'popular' }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: tones[tone].bg }]}>
      <Text style={[styles.label, { color: tones[tone].fg }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: space[2],
    paddingVertical: space[1] / 2,
  },
  label: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
  },
})
