import { displayName } from './engine'
import { defaultPlayerColor, isPlayerColor } from './players'
import { scoreKey } from './scores'
import type { TierChoice } from './generator'

const STORAGE_KEY = 'spell-duel:preferences'

export type Preferences = {
  tier: TierChoice
  colors: string[]
  lastWinner: string | null
}

const TIER_IDS: TierChoice[] = ['any', 'fun', 'normal', 'hard', 'challenging']

const DEFAULTS: Preferences = { tier: 'any', colors: [], lastWinner: null }

export const readPreferences = (): Preferences => {
  if (typeof window === 'undefined') return DEFAULTS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return DEFAULTS
    }

    const saved = parsed as Record<string, unknown>

    return {
      tier: TIER_IDS.includes(saved.tier as TierChoice)
        ? (saved.tier as TierChoice)
        : DEFAULTS.tier,
      colors: Array.isArray(saved.colors)
        ? saved.colors.map((color, index) =>
            isPlayerColor(color) ? color : defaultPlayerColor(index),
          )
        : DEFAULTS.colors,
      lastWinner:
        typeof saved.lastWinner === 'string' && saved.lastWinner.trim()
          ? saved.lastWinner
          : null,
    }
  } catch {
    return DEFAULTS
  }
}

/** Merges over the stored value so callers never clobber the other keys. */
export const savePreferences = (patch: Partial<Preferences>): Preferences => {
  const next = { ...readPreferences(), ...patch }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Keep the in-memory preferences usable when storage is unavailable.
    }
  }

  return next
}

/** Last round's winner opens the next game. */
export const startingIndexFor = (
  names: string[],
  lastWinner: string | null,
): number => {
  if (!lastWinner) return 0

  const winnerKey = scoreKey(lastWinner)
  const index = names.findIndex(
    (name, position) => scoreKey(displayName(name, position)) === winnerKey,
  )

  return index === -1 ? 0 : index
}
