export type LetterState = 'unused' | 'hit' | 'miss'

export type Tier = 'fun' | 'normal' | 'hard' | 'challenging'

export type Player = {
  id: number
  name: string
  score: number
  color: string
}

/** A player as configured on the setup screen, before a game starts. */
export type PlayerDraft = {
  name: string
  color: string
}

/** A concealed character slot. Non-letters are revealed from the start. */
export type Slot = {
  char: string
  isLetter: boolean
  revealed: boolean
}

export type GamePhase = 'setup' | 'playing' | 'over'

type GameCore = {
  phase: GamePhase
  phrase: string
  category: string
  slots: Slot[]
  players: Player[]
  activePlayerIndex: number
  guessedLetters: Record<string, LetterState>
  solvedBy: number | null
  lastOutcome: GuessOutcome | null
}

/** A restorable game state, without an undo history of its own. */
export type GameSnapshot = GameCore

export type GameState = GameCore & {
  history: GameSnapshot[]
}

export type GuessOutcome =
  | { kind: 'hit'; letter: string; occurrences: number; points: number }
  | { kind: 'miss'; letter: string }
  | { kind: 'rejected'; letter: string; reason: 'already-guessed' }
  | { kind: 'solved'; points: number }
  | { kind: 'revealed' }
  | { kind: 'solve-failed' }

export const SOLVE_BONUS = 5
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
export const MAX_HISTORY = 20
