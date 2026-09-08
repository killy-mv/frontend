# Loom

The design system for the t-shirt-sell app. Web and mobile.

## The product, in one paragraph

People browse clothes. They scroll a grid of photographs, look closely at a few, check whether their size is in stock, and think about it. The photography is the product; the interface is the frame around it. Purchases are considered, not impulsive.

Every decision below follows from that paragraph. If the paragraph changes, the tokens change.

## The decisions

**The interface supplies no colour.** Pure neutrals from `#FFFFFF` to `#111111`, and one saturated red reserved entirely for `sale`. Product photos are full of colour already; anything the UI adds competes with the thing being sold.

**The brand is black.** There is no brand hue to lean on, so emphasis has to come from weight, spacing and type instead. This is a harder system to design in, and that constraint is the point.

**Square.** Radii run 2–6px. Round corners read as "app"; sharp corners read as "shop". The one exception is `radius.full`, which exists for colour swatches and nothing else.

**No shadows at all.** `shadow` is exported as `null`, not omitted — elevation is a 1px border everywhere. Being explicit is what stops someone adding `elevation: 2` on mobile to "fix" a card that looks flat on purpose.

**Uppercase, letter-spaced labels.** Buttons, badges and sizes all share one voice. It is applied inside the components, so no caller has to remember it.

**Generous whitespace.** The spacing scale is the same 4px grid as Pepper, but components here reach for the larger steps.

## The files

```
tokens.ts               source of truth: primitives -> semantic
web/tokens.css          the same values as a Tailwind v4 @theme block
web/cn.ts               class-name joiner
web/button.tsx          3 variants x 3 sizes
web/badge.tsx           new | sale | soldout
web/size-selector.tsx   S M L XL, with sold-out states
web/product-card.tsx    the pattern: composes Badge, adds no colours
mobile/Button.tsx
mobile/Badge.tsx
mobile/SizeSelector.tsx
mobile/ProductCard.tsx
```

Web files are `kebab-case`, mobile files are `PascalCase` — each follows its own ecosystem's convention rather than forcing one on both.

## Reading the token tiers

```
tier 1  primitive   palette.ink900 = '#111111'          raw value, no meaning
tier 2  semantic    color.brand    = ink900             what it is for
        component   the variant maps inside button.tsx   where it is spent
```

On the web the primitives are namespaced `--loom-*` specifically so Tailwind will *not* generate `bg-loom-ink-500` — the only colours reachable from a class name are the semantic ones. That is the enforcement, and it is the difference between a system and a folder of components.

## Two details worth stealing

**Sold-out sizes are shown and disabled, never hidden.** A shopper needs to see that their size exists and is gone; hiding it makes the page look broken. The label is struck through as well as greyed, so the state survives being read in greyscale or by someone who cannot distinguish the grey.

**`SizeSelector` is a radio group, not a row of buttons.** `role="radio"` + `aria-checked` on web, `accessibilityRole="radio"` + `accessibilityState` on mobile. Arrow keys move between options and a screen reader announces the selection. Getting this right once, in the shared component, is most of the reason the component exists.

## The customisation ladder

Always take the highest rung that works.

1. **Props** — `<Button variant="outline" size="lg">`. Covers almost everything.
2. **`className`** (web only) — a genuine one-off, and where consistency goes to die. The same override at three call sites means go to rung 3.
3. **Edit the component** — change the menu itself, so the new option exists everywhere.
4. **Edit tokens** — "everything should be a bit rounder" is `radius`, not eleven component edits.

**Props for instance-specific things. Source edits for product-wide things.**

## What is deliberately missing

No `danger` button variant — nothing in a shop is destructive, and a variant nobody uses is a variant that rots. No Dialog, no cart drawer, no dark mode (a shop that inverts its product photography's backdrop has a merchandising problem, not a theming one). No image-zoom component, though that is the most likely next addition.

## Related

- [[css]] — custom properties are the mechanism the whole token layer rides on
- [[react]] — component APIs and composition
- [[typescript]] — closed variant unions are what make the "menu" enforceable
- [[accessibility]] — radio-group semantics, state that survives greyscale
