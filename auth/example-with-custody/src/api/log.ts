// A tiny store so the UI can show what credential rode along with each request.
// Custody is invisible by design — an HttpOnly cookie is unreadable from JS —
// so without something like this you cannot see the difference between the modes.

export type LogEntry = {
  id: number
  method: string
  url: string
  carried: string
  status: number | 'network error'
  ms: number
}

let entries: LogEntry[] = []
let nextId = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function record(entry: Omit<LogEntry, 'id'>) {
  entries = [{ ...entry, id: nextId++ }, ...entries].slice(0, 10)
  emit()
}

export function clearLog() {
  entries = []
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const snapshot = () => entries
