# Design systems

Two small, complete design systems for two different products, each covering web and mobile.

```
food-sell/       Pepper — a food ordering app
t-shirt-sell/    Loom   — an apparel shop
```

They are files only: nothing to install, nothing to run. The point is to read them.

## What each folder contains

```
<app>/
  README.md          the decisions, written down
  tokens.ts          the single source of truth — every value, in hex and numbers
  web/
    tokens.css       the same tokens as a Tailwind v4 @theme block
    cn.ts            class-name joiner
    *.tsx            four components
  mobile/
    *.tsx            the same four components in React Native
```

Four layers, in the order they matter: **tokens** are the decisions, **components** encode them, **patterns** (the cards) compose them, and the README is the closest thing at this size to **governance**.

## The thing worth noticing

Both folders have identical *structure* and completely opposite *answers*.

|  | Pepper (food) | Loom (apparel) |
| --- | --- | --- |
| Brand colour | saturated tomato | black — no hue at all |
| Neutrals | warm, red-tinted | pure cool grey |
| Radius | 8–16px, buttons are pills | 2–6px, near-square |
| Elevation | soft shadows | 1px borders, `shadow = null` |
| Colour use | tags everywhere: veg, spicy, popular | one saturated colour, reserved for `sale` |
| Type | plain sentence case | uppercase, letter-spaced labels |
| Button variants | primary, secondary, ghost, **danger** | primary, **outline**, ghost |
| Product tile | horizontal row, Add button inline | tall 3:4 image, no button |
| Domain control | `QuantityStepper` | `SizeSelector` |

The structure of a design system is generic. The decisions are not — they come from the product, and copying another product's answers is how you end up with a food app that looks like a bank.

## How web and mobile relate

`tokens.ts` is the source of truth; `web/tokens.css` is a hand-written mirror of it. In a large system Style Dictionary generates the CSS from the TS. At this size, syncing two files by hand is cheaper than owning a build step.

The components share **no code at all** — Tailwind classes on one side, `StyleSheet` objects on the other. They share the numbers, the names, the variant menus, and the behaviour. That is what a cross-platform design system actually delivers: not shared code, *shared decisions*.

Three places the platforms are genuinely allowed to differ, all visible in the files:

- **Touch targets** — 44pt minimum on mobile, smaller is fine on web. Same rule ("comfortable to hit"), different number.
- **Hover** — does not exist on a phone, so press feedback replaces it.
- **Units** — CSS `letter-spacing` is relative (`em`), React Native's is absolute points, so the token is stored unitless and each platform multiplies.

## What is deliberately missing

No Dialog, no Toast, no dark mode, no Storybook, no package boundary, no versioning. Those are all real parts of a mature system and none of them belong here yet — a design system earns its next piece when a second consumer needs it, not before.
