// 8. ESCAPE HATCHES — and why TypeScript is deliberately unsound
//
// `any`, `as` and `!` all let you overrule the checker. TypeScript ships them
// on purpose: the trade is a few holes in exchange for being able to describe
// real-world JavaScript. Each one is you taking responsibility.

const raw = '{"id": "not-a-number"}' // the server lied about the shape

// ---------------------------------------------------------------------------
// `any` switches the checker OFF. It compiles, and then it crashes.
// `any` is contagious: everything you touch through it becomes `any` too.
// ---------------------------------------------------------------------------
const viaAny: any = JSON.parse(raw)

try {
  console.log(viaAny.id.toFixed(2))
} catch (error) {
  // Note: under `strict`, `error` in a catch is `unknown` — narrow it first.
  console.log("any     ->", error instanceof Error ? error.message : "threw")
}

// ---------------------------------------------------------------------------
// `unknown` is the safe version: a box you must open before use.
// Same "I don't know what this is", opposite consequence.
// ---------------------------------------------------------------------------
const viaUnknown: unknown = JSON.parse(raw)

// @ts-expect-error you can't touch it until it's narrowed
viaUnknown.id

if (
  typeof viaUnknown === "object" &&
  viaUnknown !== null &&
  "id" in viaUnknown &&
  typeof viaUnknown.id === "number"
) {
  console.log("unknown ->", viaUnknown.id.toFixed(2))
} else {
  console.log("unknown -> rejected at the boundary, before it could crash")
}

// ---------------------------------------------------------------------------
// `as` is a CLAIM, not a conversion. No code runs; nothing is checked.
// ---------------------------------------------------------------------------
type Payload = { id: number }

const claimed = JSON.parse(raw) as Payload
console.log("as      -> typed as number, actually:", typeof claimed.id)

// TypeScript only blocks assertions between totally unrelated sets:
// @ts-expect-error a number and a Payload have nothing in common
const nonsense = 42 as Payload

// ...which is why `as unknown as X` is the classic way to launder a lie.
// If you write it, leave a comment explaining why it's safe.

// ---------------------------------------------------------------------------
// `!` is "trust me, this isn't null". Same deal, shorter.
// ---------------------------------------------------------------------------
const found = [1, 2, 3].find((value) => value > 10) // number | undefined

// console.log(found!.toFixed())   // compiles fine; throws at runtime

console.log("!       ->", found === undefined ? "handled the undefined case" : found)

// ---------------------------------------------------------------------------
// RULES OF THUMB
//   - Default to `unknown` at every boundary: JSON, localStorage, postMessage,
//     URL params, third-party callbacks.
//   - `as` is a smell you should be able to justify in one sentence.
//   - `any` is for silencing the checker mid-migration. Nothing else.
//   - Turning `strict` off to make errors go away removes most of the value
//     you're paying for by using TypeScript at all.
// ---------------------------------------------------------------------------

export {}
