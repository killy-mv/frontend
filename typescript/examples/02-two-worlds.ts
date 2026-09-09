// 2. TWO WORLDS: VALUES AND TYPES
//
// The VALUE world is real JavaScript — it exists when the program runs.
// The TYPE world is erased at compile time — it exists only for the checker.
// They even have separate namespaces.

type User = { name: string }
const User = { name: "ann" } // legal: no collision, different worlds

// ---------------------------------------------------------------------------
// `typeof` in a TYPE position is the bridge: value -> type.
// Write the object once, get the type for free.
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG = {
  baseUrl: "https://api.example.com",
  retries: 3,
}

type Config = typeof DEFAULT_CONFIG // { baseUrl: string; retries: number }

function describe(path: string, config: Config): string {
  return `${config.baseUrl}${path} (retries: ${config.retries})`
}

console.log(describe("/users", DEFAULT_CONFIG))
console.log(describe("/users", { ...DEFAULT_CONFIG, retries: 0 }))

// ---------------------------------------------------------------------------
// The bridge only goes one way. There is no `Config` at runtime:
//
//   if (input instanceof Config) { }   // <- Config is not a value
//
// In fact, this file runs on plain Node precisely BECAUSE the types can be
// stripped out and valid JavaScript is left behind.
// ---------------------------------------------------------------------------

// A type annotation is a CLAIM, not a check. Nothing validates it.
const fromNetwork = JSON.parse('{"baseUrl": 42}') as Config

console.log("claimed string, actually:", typeof fromNetwork.baseUrl) // "number"

// ---------------------------------------------------------------------------
// PRACTICAL: at a boundary (network, localStorage, postMessage) you have to
// do the check yourself. A type predicate (`value is Config`) is how you hand
// the result of a real runtime check back to the type world.
// ---------------------------------------------------------------------------
function isConfig(value: unknown): value is Config {
  return (
    typeof value === "object" &&
    value !== null &&
    "baseUrl" in value &&
    typeof value.baseUrl === "string" &&
    "retries" in value &&
    typeof value.retries === "number"
  )
}

for (const payload of ['{"baseUrl": "https://x.dev", "retries": 1}', '{"baseUrl": 42}']) {
  const parsed: unknown = JSON.parse(payload)
  console.log(isConfig(parsed) ? `ok: ${describe("/ping", parsed)}` : `rejected: ${payload}`)
}

export {}
