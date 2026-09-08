import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native'
import { color, font, radius, space, tapTarget } from '../tokens'

/**
 * Mirror of web/button.tsx: three variants, three sizes, uppercase tracked
 * labels, square corners.
 *
 * One real unit difference to notice — CSS letter-spacing is relative (`0.08em`)
 * while React Native's is absolute points, so the token is stored unitless in
 * tokens.ts and each platform multiplies it by the font size itself.
 */
type Props = Omit<PressableProps, 'style'> & {
  label: string
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  block?: boolean
}

export function Button({ label, variant = 'primary', size = 'md', block, disabled, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        sizeStyles[size].container,
        block && styles.block,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          variantStyles[variant].label,
          sizeStyles[size].label,
          disabled && styles.disabledLabel,
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    borderRadius: radius.sm,
  },
  block: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: color.disabled, borderColor: 'transparent' },
  label: { fontWeight: font.weight.medium },
  disabledLabel: { color: color.disabledFg },
})

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: color.brand },
    label: { color: color.brandFg },
  }),
  outline: StyleSheet.create({
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.borderStrong },
    label: { color: color.text },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    label: { color: color.textMuted },
  }),
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: { height: 36, paddingHorizontal: space[4] },
    label: { fontSize: font.size.xs, letterSpacing: font.size.xs * font.tracking.label },
  }),
  md: StyleSheet.create({
    container: { height: tapTarget, paddingHorizontal: space[6] },
    label: { fontSize: font.size.sm, letterSpacing: font.size.sm * font.tracking.label },
  }),
  lg: StyleSheet.create({
    container: { height: 56, paddingHorizontal: space[8] },
    label: { fontSize: font.size.sm, letterSpacing: font.size.sm * font.tracking.label },
  }),
}
