# typescript 

## The mental model in one paragraph
TypeScript is a **description layer over JavaScript that disappears at runtime**. A type is a *set of values*; a type annotation is a *claim* you make to the compiler; the compiler's only job is to check that your claims are consistent with each other. It is not a runtime guarantee — the types are stripped out before the code ever executes. Everything else in the language falls out of those two facts.

## The eight concepts

| # | Concept | The one-line version |
|---|---|---|
| [01](examples/01-types-are-sets.ts) | Types are sets | `"GET" \| "POST"` is a set with 2 members; "assignable" means "is a subset of" |
| [02](examples/02-two-worlds.ts) | Two worlds, one erased | Values exist at runtime, types don't; `typeof` is the one-way bridge |
| [03](examples/03-structural-typing.ts) | Structural typing | Shape beats name — no `implements`, no ceremony |
| [04](examples/04-inference-and-widening.ts) | Inference & widening | `let` widens to `string`, `const` keeps `"GET"`; annotate boundaries only |
| [05](examples/05-narrowing.ts) | Narrowing | `typeof`, `in`, `Array.isArray` and your own predicates shrink a union |
| [06](examples/06-discriminated-unions.ts) | Discriminated unions | A shared literal field makes illegal states unrepresentable |
| [07](examples/07-generics.ts) | Generics | Use one when the output type *depends on* the input type |
| [08](examples/08-escape-hatches.ts) | `any` / `unknown` / `as` | The system is deliberately unsound; each hatch is you taking responsibility |

Read them in order — each builds on the last.

## Running them

Node 24 runs `.ts` files directly by **stripping the types**, so there's no build step:

```sh
node examples/01-types-are-sets.ts
```

That's concept 02 demonstrated by the tooling itself: Node deletes every annotation and runs the JavaScript underneath. It never type-checks anything. For that you need the compiler:

```sh
npx -p typescript tsc --noEmit
```

That checks every file against `tsconfig.json` and prints nothing when they all pass.

> `07-generics.ts` makes a real network request to `jsonplaceholder.typicode.com`. The rest are offline.

## How the examples are written
Every intentional mistake is marked with `// @ts-expect-error` and a note saying why:

```ts
// @ts-expect-error "PATCH" is not a member of the set
const bad: HttpMethod = "PATCH"
```

That directive means "the next line **must** fail to compile". So `tsc --noEmit` passes on the whole folder, and if a future TypeScript version ever stops flagging one of these, the check breaks and tells you. The errors are part of the lesson, not leftovers.

Open a file in your editor and **hover over the variables**. Most of what these examples teach is what the compiler inferred, and you can only see that by hovering. The [Playground](https://www.typescriptlang.org/play) works too if you'd rather not leave the browser.

## The settings that matter
`tsconfig.json` here is deliberately small. The only line doing real work:

```json
"strict": true
```

It's a bundle of flags, and `strictNullChecks` is the one that earns its keep — without it `null` and `undefined` belong to *every* type, and the compiler will happily wave through the single most common crash in JavaScript. Start strict. Turning it off to make red squiggles disappear removes most of the reason to use TypeScript at all.

## What's deliberately not here
Conditional types, mapped types, template literal types, decorators, `infer`. They're the type-level metaprogramming layer — powerful, and almost never what a beginner is actually blocked on. Come back to them when you hit a concrete problem the eight concepts above can't express.

## Worth reading
- [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — official, short, and a good tour; thin on practice
- [Total TypeScript: Beginner's TypeScript](https://www.totaltypescript.com/) — free, exercise-driven, fills the practice gap
- [type-challenges](https://github.com/type-challenges/type-challenges) — much later, for the type-level deep end
