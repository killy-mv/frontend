import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native'
import { color, font, radius, space, tapTarget } from '../tokens'

/**
 * The same button as web/button.tsx: same four variants, same three sizes, same
 * closed menu. Only the delivery changes — StyleSheet objects instead of
 * Tailwind classes, both reading the identical numbers out of ../tokens.ts.
 *
 * That is what "one design system, two platforms" actually means in practice.
 * Not shared code — shared decisions.
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
        // No :hover on a phone. Press feedback replaces it, which is why the
        // hover colours in tokens.ts get used differently on each platform.
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
        {label}
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
    borderRadius: radius.full,
  },
  block: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { backgroundColor: color.disabled },
  label: { fontWeight: font.weight.medium },
  disabledLabel: { color: color.disabledFg },
})

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: color.brand },
    label: { color: color.brandFg },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: color.brandSubtle },
    label: { color: color.brand },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    label: { color: color.text },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: color.danger },
    label: { color: color.brandFg },
  }),
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: { height: 36, paddingHorizontal: space[4] },
    label: { fontSize: font.size.sm },
  }),
  md: StyleSheet.create({
    container: { height: tapTarget, paddingHorizontal: space[5] },
    label: { fontSize: font.size.base },
  }),
  lg: StyleSheet.create({
    container: { height: 52, paddingHorizontal: space[6] },
    label: { fontSize: font.size.lg },
  }),
}
