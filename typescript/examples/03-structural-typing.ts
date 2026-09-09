// 3. STRUCTURAL TYPING — shape beats name
//
// A value fits a type if its SHAPE matches. The name of the type is
// irrelevant, and there is no `implements` step. Java/C# people find this
// surprising; it's the reason TypeScript can describe existing JS libraries
// without rewriting them.

type Point = { x: number; y: number }
type Coordinate = { x: number; y: number }

const start: Point = { x: 0, y: 0 }
const end: Coordinate = start // different names, identical shape: fine

// A class isn't special either — only its resulting shape counts.
class Vector {
  x = 3
  y = 4
}

const fromClass: Point = new Vector() // no `implements Point` needed
console.log("class instance used as a Point:", fromClass)

// ---------------------------------------------------------------------------
// "At least this shape" — extra properties are fine through a variable...
// ---------------------------------------------------------------------------
const detailed = { x: 1, y: 2, label: "origin" }
const p: Point = detailed // ok: it has at least x and y

// ...but a direct object literal gets an extra "did you typo this?" check.
// @ts-expect-error excess property check on a fresh literal
const q: Point = { x: 1, y: 2, label: "origin" }

// ---------------------------------------------------------------------------
// PRACTICAL 1: ask for the smallest shape you actually use.
// Then real objects AND test doubles both fit, with no adapter code.
// ---------------------------------------------------------------------------
type Logger = { log: (message: string) => void }

function saveUser(name: string, logger: Logger): void {
  logger.log(`saved ${name}`)
}

saveUser("ann", console) // `console` structurally matches Logger

const captured: string[] = []
saveUser("bob", { log: (message) => void captured.push(message) })
console.log("captured by the test double:", captured)

// ---------------------------------------------------------------------------
// PRACTICAL 2: the flip side. Two types that MEAN different things but share
// a shape are interchangeable, and TS will not stop you mixing them up.
// ---------------------------------------------------------------------------
type UserId = { value: string }
type OrderId = { value: string }

const userId: UserId = { value: "u_1" }
const orderId: OrderId = userId // no error — same shape, same set

// The fix is a "brand": add a property that only exists in the type world,
// so the two shapes genuinely differ.
type Branded<T, B extends string> = T & { readonly __brand: B }
type SafeUserId = Branded<string, "UserId">
type SafeOrderId = Branded<string, "OrderId">

const safeUser = "u_1" as SafeUserId
// @ts-expect-error a UserId is no longer accepted where an OrderId is wanted
const safeOrder: SafeOrderId = safeUser

export {}
