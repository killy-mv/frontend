import { cookieSession } from './cookieSession'
import { hybrid } from './hybrid'
import { memoryToken } from './memoryToken'
import type { Custody, ModeId } from './types'

export const MODES: Custody[] = [cookieSession, memoryToken, hybrid]

const STORAGE_KEY = 'custody-mode'

export function currentMode(): Custody {
  const saved = localStorage.getItem(STORAGE_KEY) as ModeId | null
  return MODES.find((mode) => mode.id === saved) ?? MODES[0]
}

/**
 * Switching custody reloads the page on purpose. The in-memory token only dies
 * on reload, and leaving one mode's credential alive while another mode runs
 * would make the "what do we hold" panel lie.
 */
export function switchMode(id: ModeId) {
  localStorage.setItem(STORAGE_KEY, id)
  location.reload()
}
