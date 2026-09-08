import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius, space } from '../tokens'

/**
 * Mirror of web/quantity-stepper.tsx. Controlled, same min/max rules.
 *
 * The one place the platforms genuinely diverge: touch targets are 44pt here
 * against 36px on web, because a finger is not a cursor. Same design decision
 * ("this must be comfortable to hit"), different number to satisfy it.
 */
type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function QuantityStepper({ value, onChange, min = 0, max = 99 }: Props) {
  return (
    <View style={styles.container}>
      <Step label="−" accessibilityLabel="Remove one" disabled={value <= min} onPress={() => onChange(value - 1)} />

      <Text
        accessibilityLiveRegion="polite"
        style={styles.value}
      >
        {value}
      </Text>

      <Step label="+" accessibilityLabel="Add one" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  )
}

function Step({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string
  accessibilityLabel: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
    >
      <Text style={[styles.stepLabel, disabled && styles.stepLabelDisabled]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1],
    padding: space[1],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  step: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  stepPressed: { backgroundColor: color.brandSubtle },
  stepLabel: { fontSize: font.size.xl, color: color.brand },
  stepLabelDisabled: { color: color.disabledFg },
  value: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: font.size.base,
    fontWeight: font.weight.medium,
    color: color.text,
  },
})
