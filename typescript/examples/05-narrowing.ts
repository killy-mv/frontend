// 5. NARROWING — how a union shrinks as it flows through your code
//
// This is the daily-driver skill. TypeScript reads your `if`s and follows the
// control flow, shrinking the set of possible values branch by branch.

// ---------------------------------------------------------------------------
// typeof + a null check. Hover each `return` to watch the set shrink.
// ---------------------------------------------------------------------------
function format(value: string | number | Date | null): string {
  if (value === null) return "-" // remaining: string | number | Date
  if (typeof value === "string") return value.trim() // remaining: number | Date
  if (typeof value === "number") return value.toFixed(2) // remaining: Date
  return value.toISOString() // only Date is left
}

console.log([format("  hi  "), format(3.14159), format(new Date(0)), format(null)])

// ---------------------------------------------------------------------------
// `in` narrows by the presence of a property
// ---------------------------------------------------------------------------
type Cat = { name: string; meow: () => string }
type Dog = { name: string; bark: () => string }

function speak(pet: Cat | Dog): string {
  return "meow" in pet ? pet.meow() : pet.bark()
}

console.log(speak({ name: "tom", meow: () => "meow" }))
console.log(speak({ name: "rex", bark: () => "woof" }))

// ---------------------------------------------------------------------------
// Array.isArray narrows too — handy for "one or many" arguments
// ---------------------------------------------------------------------------
function toArray(input: string | string[]): string[] {
  return Array.isArray(input) ? input : [input]
}

console.log(toArray("solo"), toArray(["a", "b"]))

// ---------------------------------------------------------------------------
// TRAP: truthiness narrows, but 0 and "" are falsy AND valid.
// ---------------------------------------------------------------------------
function labelWrong(count: number | undefined): string {
  if (!count) return "unknown" // also swallows 0 — a real bug
  return `${count} items`
}

function labelRight(count: number | undefined): string {
  if (count === undefined) return "unknown" // narrows on exactly the bad case
  return `${count} items`
}

console.log("wrong:", labelWrong(0), "| right:", labelRight(0))

// ---------------------------------------------------------------------------
// PRACTICAL: your own narrowing, via a type predicate (`value is ApiUser`).
// Use it at every boundary where data arrives as `unknown`.
// ---------------------------------------------------------------------------
type ApiUser = { id: number; name: string }

function isApiUser(value: unknown): value is ApiUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string"
  )
}

const payloads: unknown[] = [{ id: 1, name: "ann" }, { id: "2", name: "bob" }, null]

for (const payload of payloads) {
  // Inside this branch `payload` is an ApiUser — autocomplete and all.
  console.log(isApiUser(payload) ? `user #${payload.id}: ${payload.name}` : "invalid payload")
}

export {}
