// 7. GENERICS — functions in the type world
//
// A generic takes a TYPE as an argument. Reach for one when the output type
// DEPENDS ON the input type. If it doesn't, you don't need a generic.

// ---------------------------------------------------------------------------
// Without a generic you'd have to widen to `unknown` and every caller would
// lose the type. `T` carries it through instead.
// ---------------------------------------------------------------------------
function first<T>(items: T[]): T | undefined {
  return items[0]
}

const firstNumber = first([1, 2, 3]) // number | undefined
const firstName = first(["ann", "bob"]) // string | undefined
console.log(firstNumber?.toFixed(1), firstName?.toUpperCase())

// You almost never pass the type explicitly — it's inferred from the argument.

// ---------------------------------------------------------------------------
// CONSTRAINTS: `extends` limits which types T is allowed to be.
// Read it as "T, as long as it's a subset of this shape".
// ---------------------------------------------------------------------------
function byId<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id)
}

const users = [
  { id: 1, name: "ann", email: "ann@example.com" },
  { id: 2, name: "bob", email: "bob@example.com" },
]

// The return type is the FULL user, not just `{ id: number }` — that's the
// whole point of the generic. `.name` still exists.
console.log(byId(users, 2)?.name)

// @ts-expect-error numbers have no `id`, so they don't satisfy the constraint
byId([1, 2, 3], 1)

// ---------------------------------------------------------------------------
// keyof: keep the link between a key and the type of its value.
// ---------------------------------------------------------------------------
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

const emails = pluck(users, "email") // string[], not unknown[]
console.log(emails.map((email) => email.split("@")[1]))

// @ts-expect-error "phone" is not a key of those objects — caught at the call
pluck(users, "phone")

// ---------------------------------------------------------------------------
// PRACTICAL: a typed fetch helper. The caller declares what it expects, so
// the shape flows all the way to the call site.
// ---------------------------------------------------------------------------
type Post = { id: number; title: string }

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as T
}

async function main(): Promise<void> {
  const post = await getJson<Post>("https://jsonplaceholder.typicode.com/posts/1")
  console.log(`post #${post.id}: ${post.title}`) // `post` is fully typed
}

// Be honest about what that `as T` is: a promise you made to yourself, not a
// check (see 08). For data you don't control, validate it — 02 and 05 show how.

main().catch((error: unknown) => console.log("request failed:", error))

export {}
