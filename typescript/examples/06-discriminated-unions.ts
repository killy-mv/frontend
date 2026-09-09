// 6. DISCRIMINATED UNIONS — make illegal states unrepresentable
//
// The single most valuable modelling pattern in the language. Give every
// variant a shared literal field (the "discriminant") and narrowing picks
// the right branch for you.

type User = { id: number; name: string }

// ---------------------------------------------------------------------------
// The loose version most people write first. It type-checks, and it allows
// states that can never actually happen:
//
//   { loading: true, error: "boom", data: user }
//
// Every consumer then has to guess which flag wins.
// ---------------------------------------------------------------------------
type LooseState = { loading: boolean; data?: User; error?: string }

// ---------------------------------------------------------------------------
// The union version deletes those states from existence.
// ---------------------------------------------------------------------------
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; message: string }

function render(state: RequestState): string {
  switch (state.status) {
    case "idle":
      return "Click to load"
    case "loading":
      return "Loading…"
    case "success":
      return `Hello, ${state.data.name}` // `data` exists only in this branch
    case "error":
      return `Failed: ${state.message}` // and `message` only in this one
    default: {
      // Exhaustiveness check. Once every case above is handled, `state` has
      // been narrowed to `never` — the empty set. Add a 5th variant and forget
      // a case, and this line stops compiling. Free coverage, no test needed.
      const unreachable: never = state
      return unreachable
    }
  }
}

const states: RequestState[] = [
  { status: "idle" },
  { status: "loading" },
  { status: "success", data: { id: 1, name: "ann" } },
  { status: "error", message: "404" },
]

for (const state of states) console.log(`${state.status.padEnd(8)} -> ${render(state)}`)

// You cannot reach into a variant you haven't narrowed to:
function careless(state: RequestState) {
  // @ts-expect-error `data` doesn't exist on every member of the union
  return state.data
}

// ---------------------------------------------------------------------------
// PRACTICAL: the same shape as a return value, so a function can fail without
// throwing — and the caller is forced to deal with it before touching `data`.
// ---------------------------------------------------------------------------
type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function parseAge(input: string): Result<number> {
  const age = Number(input)
  if (Number.isNaN(age)) return { ok: false, error: `"${input}" is not a number` }
  if (age < 0) return { ok: false, error: "age cannot be negative" }
  return { ok: true, data: age }
}

for (const input of ["42", "-1", "abc"]) {
  const result = parseAge(input)
  // @ts-expect-error can't read `data` before checking `ok`
  result.data
  console.log(result.ok ? `parsed ${result.data}` : `rejected: ${result.error}`)
}

export {}
