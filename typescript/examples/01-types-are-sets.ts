// 1. A TYPE IS A SET OF VALUES
//
//    string           -> the set of all strings
//    "GET" | "POST"   -> a set with exactly 2 members
//    never            -> the empty set
//    unknown          -> every value
//
// "Assignable" just means "is a subset of". Almost every red squiggle is
// really the question: which set isn't inside which?

// ---------------------------------------------------------------------------
// A small set, spelled out member by member
// ---------------------------------------------------------------------------
type HttpMethod = "GET" | "POST" | "DELETE"

const good: HttpMethod = "GET"

// @ts-expect-error "PATCH" is not a member of the set
const bad: HttpMethod = "PATCH"

// ---------------------------------------------------------------------------
// Assignability = the subset relation
// ---------------------------------------------------------------------------
const widened: string = good // fine: those 3 values are all strings

let anyString = "GET" // inferred as `string` = the set of ALL strings

// @ts-expect-error the other direction fails: most strings are not HttpMethods
const narrowed: HttpMethod = anyString

// ---------------------------------------------------------------------------
// Union = set UNION. More values, so fewer guarantees.
// ---------------------------------------------------------------------------
type Id = string | number

const idA: Id = "u_123"
const idB: Id = 7

function printId(id: Id): void {
  // You may only use what BOTH members support, until you narrow (see 05).
  // @ts-expect-error `toUpperCase` doesn't exist on number
  console.log(id.toUpperCase())
}

// ---------------------------------------------------------------------------
// Intersection = set INTERSECTION.
// For objects this reads backwards at first: MORE properties, FEWER values.
// A value has to satisfy both shapes, so fewer things qualify.
// ---------------------------------------------------------------------------
type HasId = { id: number }
type HasEmail = { email: string }
type Account = HasId & HasEmail

const account: Account = { id: 1, email: "ann@example.com" }

// @ts-expect-error an object with only `id` is not in the intersection
const halfAccount: Account = { id: 2 }

// ---------------------------------------------------------------------------
// never = the EMPTY set. No value is both a string and a number.
// ---------------------------------------------------------------------------
type Impossible = string & number // never

// @ts-expect-error nothing at all can be put into an empty set
const nothing: Impossible = "anything"

// ---------------------------------------------------------------------------
// PRACTICAL: the set only exists at compile time. If you also need to check
// membership at runtime, build the list as a VALUE and derive the type from it.
// One source of truth instead of two that drift apart.
// ---------------------------------------------------------------------------
const METHODS = ["GET", "POST", "DELETE"] as const
type Method = (typeof METHODS)[number] // "GET" | "POST" | "DELETE"

function isMethod(value: string): value is Method {
  return (METHODS as readonly string[]).includes(value)
}

for (const input of ["GET", "PATCH"]) {
  console.log(`${input.padEnd(6)} -> ${isMethod(input) ? "allowed" : "rejected"}`)
}

export {}
