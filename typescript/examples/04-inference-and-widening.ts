// 4. INFERENCE AND WIDENING — annotate boundaries, not everything
//
// TypeScript infers a type for every expression. When a value can later be
// reassigned, it "widens" the literal to the general type. Knowing when that
// happens explains most beginner confusion.

type HttpMethod = "GET" | "POST"

function send(method: HttpMethod, path: string): string {
  return `${method} ${path}`
}

let mutable = "GET" // -> string   (a `let` can be reassigned, so widened)
const frozen = "GET" // -> "GET"    (a `const` can't, so the literal is kept)

console.log(send(frozen, "/users"))

// @ts-expect-error `mutable` widened to `string`, which is a bigger set
send(mutable, "/users")

// ---------------------------------------------------------------------------
// The classic version of this bug: object properties are mutable, so they
// widen too — even inside a `const`.
// ---------------------------------------------------------------------------
const options = { method: "GET", path: "/users" }
// -> { method: string; path: string }

// @ts-expect-error options.method is `string`, not "GET"
send(options.method, options.path)

// `as const` keeps the literals (and marks the properties readonly)
const constOptions = { method: "GET", path: "/users" } as const
console.log(send(constOptions.method, constOptions.path))

// The other fix — annotate the object, which is often clearer:
const typedOptions: { method: HttpMethod; path: string } = {
  method: "GET",
  path: "/users",
}
console.log(send(typedOptions.method, typedOptions.path))

// ---------------------------------------------------------------------------
// PRACTICAL: over-annotating is noise, and can make inference worse.
// TypeScript already knows all of this:
// ---------------------------------------------------------------------------
const names = ["ann", "bob"] // string[]
const upper = names.map((name) => name.toUpperCase()) // string[]
console.log(upper)

// Annotate PARAMETERS (TS can't guess those) and the return types of things
// you export. Let everything inside the function infer itself.
type Person = { name: string; active: boolean }

export function activeNames(people: Person[]): string[] {
  const active = people.filter((person) => person.active) // Person[], inferred
  return active.map((person) => person.name) // string[], inferred
}

console.log(
  activeNames([
    { name: "ann", active: true },
    { name: "bob", active: false },
  ]),
)
