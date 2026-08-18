# Design System

## The core mental model

> A design system is a set of product decisions, encoded in code, so that following them is easier than not following them.

Compressed further: **decide once, encode it where people work, make the right choice the easiest one.**

Everything else — token tiers, headless primitives, shadcn, governance — is implementation detail serving that sentence.

- **Tokens and components** are how the decisions get encoded.
- **Import + props** is what it feels like to consume them.
- **Consistency** is the payoff, and it is the actual deliverable. The components are just the most practical way to make consistency the path of least resistance.

A useful test for whether you have a system or just a folder of components: *can you change your brand colour in one place and have the whole app follow?* If yes, it is a system. If you have thirty nice components each with hardcoded colours, it is a collection.

The value of a design system comes largely from what it **prevents**. Give ten developers free choice of hex codes and you get 47 greys, six button heights and four different modals. Its job is to shrink the decision space. The constraint is the feature.

## The four layers

- **Tokens** — the atomic decisions: colour, spacing, type scale, radii, shadows, motion durations.
- **Components** — reusable implementations built on those tokens.
- **Patterns** — how to compose them: modal vs drawer, how forms validate, what empty states and error messages look and sound like. Usually the thinnest layer, and where inconsistency actually shows up.
- **Governance** — who decides, how changes ship, how things get versioned and deprecated. Unglamorous, and the usual cause of death.

Note that a *component library* is one artifact inside a design system, not the whole thing, and a *style guide* is a static document while a design system is consumed as code.

## Token tiers

Tokens are tiered, and the indirection is the point:

```
primitive   ->  red-600 = #dc2626
semantic    ->  color-text-danger = red-600
component   ->  button-destructive-bg = color-text-danger
```

This looks like bureaucracy until you need dark mode, a second brand, or high contrast. Then you reskin by swapping one layer and nothing downstream changes. A codebase where components reference `red-600` directly cannot be themed; one that references `color-text-danger` can.

Only **colour** really needs all three tiers. Spacing and radii get used semi-directly because they do not change per theme. Forcing three tiers on everything produces noise.

## Why code and not a PDF

The obvious idea — write a detailed specification document for every element — is what the industry actually did until roughly 2012 (brand books, UI specs). It failed, for reasons worth remembering:

- **It loses to proximity.** A developer on a deadline copies the nearest existing button. They will not open a PDF and hand-transcribe values. Whenever the documented path is slower than copy-paste, the documentation loses.
- **The permutations explode.** One button = 4 variants x 3 sizes x 6 states x 2 themes x with/without icon ≈ 576 pictures to draw and maintain by hand. As code it is a dozen declarations and the combinations come free.
- **Behaviour barely survives prose.** A select menu is not "opens a list" — it is arrow-key navigation, type-ahead, Escape restoring focus, click-outside, flipping near the viewport edge, listbox semantics for screen readers, different touch behaviour. Pages of spec that every developer must then re-implement correctly, and will not. As code you import it and it is right.
- **Paper has no failure mode.** Use the wrong grey and nothing happens. Tokens mean the wrong grey is not in the autocomplete. That is enforcement.
- **It drifts.** The PDF says 6px radius, production ships 4px. With code there is exactly one answer, and it is the one users see.

Documentation does not disappear — it gets *generated from the code* (Storybook), so it cannot go stale.

## Atomic design

Brad Frost's methodology (~2013), a chemistry metaphor for composition levels:

- **Atoms** — irreducible primitives: label, input, button.
- **Molecules** — a few atoms bonded into one job: a search form.
- **Organisms** — larger sections: a site header.
- **Templates** — page skeletons, content-agnostic.
- **Pages** — templates filled with real, representative content.

The taxonomy is not the point. The real argument was **design systems, not pages**, and the last two stages exist to *stress-test* the system against reality — where you discover the card breaks with a 90-character title and you only ever designed against the username "Jane".

Where it goes wrong in practice:

- **The boundaries are arbitrary.** Is a search form a molecule or an organism? No principled answer, and the answer changes nothing.
- **Organising directories by atomic level is the classic mistake.** It scatters related code, makes every new file a taxonomy debate, and the folder name tells you nothing about what the thing does.
- **The metaphor leaks.** Real composition is not a strict hierarchy.

What teams do instead: organise by **domain, with a flat shared primitives layer**.

```
components/ui/        Button, Input, Dialog (the shared vocabulary)
components/           composed, app-specific pieces
features/checkout/    everything for one slice of the product
```

The useful split turned out to be *how widely is it shared*, not *how small is it*. Keep the atomic vocabulary for conversation; keep it out of the file tree.

## The headless split

The dominant architectural idea now: behaviour and accessibility are hard and universal, styling is easy and specific — so separate them. Radix, React Aria and Base UI ship a correct, accessible, unstyled combobox (focus management, keyboard nav, ARIA, portals, collision detection) and you paint it. Building that yourself is weeks of work and the accessibility will be wrong.

## Two scales

**Startup scale** — a `src/components/ui/` folder, one CSS file of custom properties, and a README saying "use these, don't invent new greys". No package, no versioning, no governance. This is a complete, legitimate design system.

**Enterprise scale** — 40–60 components, several hundred tokens, 2–5 full-time people, a monorepo:

```
packages/tokens/     values only, compiled to CSS vars / TS / Figma JSON
packages/react/      the components (+ stories, tests per component)
packages/icons/      generated from SVG
apps/docs/           the documentation site
.changeset/          versioning and release notes
```

The repo structure is a **delivery mechanism, not the design system itself**. You only need it when a second consumer exists. The triggers are all organisational, not technical:

- multiple codebases (product app, marketing site, admin panel)
- multiple teams — a package boundary is really a *contract* boundary
- non-web platforms (iOS, Android, email) that need the same values
- independent release cadence

Tokens get their own boundary earliest because they have consumers that are not components (charts, canvas, email, Figma) and they change on a different clock than components. At small scale, "separate" means a separate *file*, not a separate package.

**Cost of splitting early:** every change becomes edit → build → version bump → publish → install. Iteration speed drops by an order of magnitude, which is fatal while the system is still being figured out. Rule of thumb: keep it in the app until a second real consumer exists.

## Published systems vs tools

A category distinction that causes confusion:

- **Finished design systems made by someone else** — Material Design 3, Apple HIG, Fluent, Carbon, Atlassian. Complete sets of decisions, published for wholesale adoption. You would adopt one to get a polished, accessible product without employing a designer; the price is that your product looks like theirs.
- **Tools for building your own** — Style Dictionary (token compiling), Storybook (docs), Radix / React Aria (behaviour), Figma variables.

You need neither to have a design system. Material 3 feels impenetrable because it coordinates thousands of engineers across a decade and several platforms — that complexity is organisational, not inherent to the idea.

## shadcn/ui

A collection of accessible React components, MIT licensed. **Not a dependency** — a CLI copies the source into your repo:

```
npx shadcn@latest add button
```

writes `components/ui/button.tsx`. That file is now your code. Built on Radix (increasingly also Base UI) for behaviour, Tailwind for styling, CVA for variants, and `clsx` + `tailwind-merge` via a `cn()` helper for className merging.

It is **not a design system you adopt** — it is a starting point for building your own. It hands you the components layer and a token setup (CSS variables in your global stylesheet, pre-wired for theming). The decisions and constraints are still yours.

### Why the copy-not-install model caught on

The classic pain with MUI or Bootstrap is **override hell**: the component is 90% right, you need one change, and now you are fighting specificity or a theme API. With shadcn you open the file and change the line. No version lock, no black boxes.

**The cost:** no upstream updates. Bug fixes and accessibility improvements never reach you; re-running `add` overwrites your edits. Thirty components in your repo means thirty you now maintain. Across a large org everyone's copy drifts — which is the exact problem a design system exists to solve. Suits a single product well, a multi-team platform poorly.

### Workflow

**Setup (once).** `npx shadcn@latest init` writes `components.json` (config — commit it), CSS custom properties into your stylesheet (`--background`, `--primary`, `--muted`, `--destructive`, plus a `.dark` block — *this is your token layer*), and `lib/utils.ts` with `cn()`.

**Daily loop.** `npx shadcn@latest add button dialog input` → files land in `components/ui/` → import from `@/components/ui/button`. That is the only unusual step, and it happens maybe twice a week.

**Ownership boundary.**

- `components/ui/` — shadcn primitives. Semi-generated; edits are deliberate and reviewed.
- `components/` — yours. `ConfirmDialog`, `PageHeader`, `DataTable`. Most of your work lives here. **Wrapping beats editing.**

**Updating.** No real upgrade path. Mitigation is git: commit the pristine component first, then your customisations separately, so you can overwrite with upstream and replay your diff. Keep `ui/` edits small and legible.

**At team scale.** `components.json` is committed so everyone's CLI behaves identically; `components/ui/` changes get real PR review because the blast radius is the whole product. Custom **registries** let an org publish its own components consumed by the same `npx shadcn add` flow — the migration path to a real internal design system without changing how developers work.

**Gotchas.** Path aliases (`@/`) must be configured in `tsconfig.json`. Icons default to `lucide-react`. Some components ship `"use client"`. Tailwind v4 moved theme config into CSS, so older tutorials look wrong.

### Using a component

You rarely edit the source. Props do two different jobs:

```tsx
<Button
  variant="destructive"   // appearance — pick from a fixed menu
  size="sm"               // appearance — pick from a fixed menu
  onClick={handleDelete}  // behaviour — plain DOM prop, passed through
  disabled={isPending}    // behaviour — plain DOM prop, passed through
>
  Delete
</Button>
```

**Behaviour props are unconstrained** — the component spreads `{...props}` onto the real `<button>`, so `onClick`, `type`, `form`, `aria-*` and `data-*` all just work. It is typed as `React.ComponentProps<"button">` plus the variant props. (In React 19 `ref` is a plain prop, so no `forwardRef` wrapper.)

**Appearance props are a closed menu** — `variant` accepts exactly `default | secondary | destructive | outline | ghost | link`; TypeScript rejects anything else. You are not describing a look, you are *selecting* one that was already decided. That is the design system idea in miniature: five buttons exist, so a sixth cannot accidentally appear because someone was in a hurry.

The design is not really *in* the component — `button.tsx` references tokens (`bg-primary text-primary-foreground`) that live in your global stylesheet. The component owns its *shape* (heights, padding, radius, the variant menu) but not its palette.

**`asChild`** handles the case that looks like it needs a source edit but does not:

```tsx
<Button asChild>
  <Link href="/settings">Settings</Link>
</Button>
```

`Slot` merges the button's classes and props onto the `Link` instead of nesting an `<a>` inside a `<button>`. The same pattern recurs throughout the library (tooltip triggers, dialog triggers).

### The customisation ladder

Always reach for the highest level that works:

1. **Variant props** — pick from the menu. Covers the vast majority of use.
2. **`className`** — arbitrary override for a genuine one-off. `tailwind-merge` ensures your class beats the component's conflicting one instead of losing a specificity coin-flip. This is the escape hatch, and where consistency goes to die. Pasting the same `className` at three call sites is the signal to promote it to level 3.
3. **Edit the component file** — *change the menu itself*, so the new option exists everywhere. Worth it for a `loading` prop used on half your buttons, or a variant used in twenty places.
4. **Edit tokens** — change what every component is made of. "All our buttons should be less rounded" is `--radius`, not a component edit.

**The rule: props for instance-specific things, source edits for product-wide things.**

Realistically you add ~20 components and edit two or three of them, once each — usually Button (a loading state), maybe Input or Dialog. The rest stay untouched for the life of the project. The value of owning the source is not constant editing; it is that when you *do* need a change, it is a two-minute diff instead of an afternoon fighting a theme API.

## Related

- [[css]] — custom properties are the mechanism the whole token layer rides on
- [[react]] — component APIs, composition, `asChild` / Slot
- [[typescript]] — closed variant unions are what make the "menu" enforceable
- [[accessibility]] — the main thing headless primitives buy you
