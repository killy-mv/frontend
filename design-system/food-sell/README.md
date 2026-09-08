# Pepper

The design system for the food-sell app. Web and mobile.

## The product, in one paragraph

People order food on a phone, one-handed, usually hungry and usually in a hurry. They scan a long list of dishes, tap Add a few times, and leave. Nothing in the app is a considered purchase and nothing is destructive. Speed and appetite are the whole job.

Every decision below follows from that paragraph. If the paragraph changes, the tokens change.

## The decisions

**Warm neutrals, not grey.** Even the background carries red (`#FAF8F6`). A neutral-grey food app reads as a spreadsheet.

**One saturated brand colour, tomato.** It marks exactly one thing: the action that adds food to the cart. Anything else competing for that colour is a bug.

**Round.** Radii run 8–16px and buttons are full pills. This is the single decision that does most of the work in making the app feel friendly rather than administrative.

**Soft shadows.** Cards lift off the warm background. Borders would feel like a form.

**Colour is cheap here.** Dietary and heat tags are the interface — `veg`, `spicy`, `popular` each get their own token pair (a fill and a text colour). Compare with Loom, where colour is scarce.

**44px minimum on anything tappable**, on both platforms. `tapTarget` is a token because it is a rule, not a preference.

## The files

```
tokens.ts               source of truth: primitives -> semantic
web/tokens.css          the same values as a Tailwind v4 @theme block
web/cn.ts               class-name joiner
web/button.tsx          4 variants x 3 sizes
web/badge.tsx           veg | spicy | popular | soldout
web/quantity-stepper.tsx  - 1 +
web/dish-card.tsx       the pattern: composes Badge + Button, adds no colours
mobile/Button.tsx
mobile/Badge.tsx
mobile/QuantityStepper.tsx
mobile/DishCard.tsx
```

Web files are `kebab-case`, mobile files are `PascalCase` — each follows its own ecosystem's convention rather than forcing one on both.

## Reading the token tiers

```
tier 1  primitive   palette.tomato500 = '#F0512B'      raw value, no meaning
tier 2  semantic    color.brand       = tomato500      what it is for
        component   the variant maps inside button.tsx  where it is spent
```

The indirection looks like bureaucracy until you need dark mode or a second brand. Then you swap tier 2 and nothing downstream moves. On the web the primitives are namespaced `--pepper-*` specifically so Tailwind will *not* generate `bg-pepper-tomato-500` — the only colours reachable from a class name are the semantic ones. That is the enforcement.

## The customisation ladder

Always take the highest rung that works.

1. **Props** — `<Button variant="secondary" size="lg">`. Covers almost everything.
2. **`className`** (web only) — a genuine one-off. This is the escape hatch and where consistency goes to die. The same override at three call sites is the signal to go to rung 3.
3. **Edit the component** — change the menu itself, so the new option exists everywhere. A `loading` state on Button would land here.
4. **Edit tokens** — change what everything is made of. "Our buttons should be less round" is `radius`, not a component edit.

**Props for instance-specific things. Source edits for product-wide things.**

## What is deliberately missing

No Dialog, no Toast, no form validation pattern, no dark mode, no `loading` button state. All of them are plausible next additions; none of them exist until a screen actually needs one. A design system grows from real demand, not from a checklist.

`cn.ts` is three lines instead of `clsx` + `tailwind-merge`. Swap it the first time a caller's `className` loses a specificity coin-flip to the component's own class.

## Related

- [[css]] — custom properties are the mechanism the whole token layer rides on
- [[react]] — component APIs and composition
- [[typescript]] — closed variant unions are what make the "menu" enforceable
- [[accessibility]] — tap targets, `aria-live` on the stepper
