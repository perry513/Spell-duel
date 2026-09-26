import type { Player } from './types'

const STORAGE_KEY = 'spell-duel:scores'

export type SavedScore = {
  name: string
  score: number
}

export type SavedScores = Record<string, SavedScore>

export const scoreKey = (name: string): string => name.trim().toLocaleLowerCase()

export const readSavedScores = (): SavedScores => {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, value]) => {
        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value)
        ) {
          return []
        }

        const savedScore = value as { name?: unknown; score?: unknown }
        if (
          typeof savedScore.name !== 'string' ||
          savedScore.name.trim().length === 0 ||
          typeof savedScore.score !== 'number' ||
          !Number.isFinite(savedScore.score) ||
          savedScore.score <= 0
        ) {
          return []
        }

        return [[key, { name: savedScore.name, score: savedScore.score }]]
      }),
    )
  } catch {
    return {}
  }
}

export const writeSavedScores = (scores: SavedScores): void => {
  if (typeof window === 'undefined') return

  try {
    if (Object.keys(scores).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
  }
}

export const scoresForNames = (
  names: string[],
  savedScores: SavedScores,
): number[] =>
  names.map((name, index) => {
    const displayName = name.trim() || `Player ${index + 1}`
    return savedScores[scoreKey(displayName)]?.score ?? 0
  })

export const mergePlayerScores = (
  savedScores: SavedScores,
  players: Player[],
): SavedScores => {
  const nextScores = { ...savedScores }

  for (const player of players) {
    const key = scoreKey(player.name)
    if (!key) continue

    if (player.score > 0) {
      nextScores[key] = { name: player.name, score: player.score }
    }
    else delete nextScores[key]
  }

  return nextScores
}