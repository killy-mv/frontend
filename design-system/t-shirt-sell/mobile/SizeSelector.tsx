import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius, space, tapTarget } from '../tokens'

/**
 * Mirror of web/size-selector.tsx. Sold-out sizes stay visible and disabled,
 * struck through so the state survives greyscale.
 *
 * Accessibility is the one place the two platforms look least alike and mean
 * exactly the same thing: `role="radio"` + `aria-checked` on the web,
 * `accessibilityRole="radio"` + `accessibilityState` here. Getting this right
 * once, in the shared component, is most of why the component exists.
 */
type Size = { label: string; soldOut?: boolean }

type Props = {
  sizes: Size[]
  value?: string
  onChange: (label: string) => void
}

export function SizeSelector({ sizes, value, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Size" style={styles.group}>
      {sizes.map(({ label, soldOut }) => {
        const selected = value === label

        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !!soldOut }}
            disabled={soldOut}
            onPress={() => onChange(label)}
            style={[styles.option, selected && styles.optionSelected, soldOut && styles.optionSoldOut]}
          >
            <Text
              style={[
                styles.label,
                selected && styles.labelSelected,
                soldOut && styles.labelSoldOut,
              ]}
            >
              {label.toUpperCase()}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  option: {
    minWidth: tapTarget,
    height: tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  optionSelected: { borderColor: color.borderStrong, backgroundColor: color.brand },
  optionSoldOut: { borderColor: color.border },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    letterSpacing: font.size.sm * font.tracking.label,
    color: color.text,
  },
  labelSelected: { color: color.brandFg },
  labelSoldOut: { color: color.soldOut, textDecorationLine: 'line-through' },
})
