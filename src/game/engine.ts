import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  SOLVE_BONUS,
  type GameState,
  type LetterState,
  type Player,
  type Slot,
} from './types'

export type Rng = () => number

const LETTER = /\p{Letter}/u

const isLetter = (char: string) => LETTER.test(char)

const normalizeLetter = (letter: string) => letter.toUpperCase()

/** Collapses whitespace and casing so "  The  Big Sky " matches "The Big Sky". */
const normalizePhrase = (phrase: string) =>
  phrase.trim().replace(/\s+/gu, ' ').toUpperCase()

export const toSlots = (phrase: string): Slot[] =>
  [...phrase].map((char) => ({
    char,
    isLetter: isLetter(char),
    revealed: !isLetter(char),
  }))

export const distinctLetters = (phrase: string): string[] => [
  ...new Set([...phrase].filter(isLetter).map(normalizeLetter)),
]

export const isGameOver = (slots: Slot[]): boolean =>
  slots.every((slot) => slot.revealed)

export const concealedCount = (slots: Slot[], letter: string): number =>
  slots.filter(
    (slot) => !slot.revealed && normalizeLetter(slot.char) === letter,
  ).length

export const winners = (players: Player[]): Player[] => {
  const top = Math.max(...players.map((player) => player.score))
  return players.filter((player) => player.score === top)
}

export const createPlayers = (names: string[]): Player[] =>
  names
    .slice(0, MAX_PLAYERS)
    .map((name, index) => ({
      id: index,
      name: name.trim() || `Player ${index + 1}`,
      score: 0,
    }))

export const validatePhrase = (phrase: string): string | null => {
  const trimmed = phrase.trim()
  if (trimmed.length === 0) return 'Enter a word or phrase.'
  if (distinctLetters(trimmed).length < 2)
    return 'Needs at least two different letters.'
  return null
}

export const validateNames = (names: string[]): string | null => {
  if (names.length < MIN_PLAYERS) return `Needs at least ${MIN_PLAYERS} players.`
  return null
}

export type CreateGameInput = {
  phrase: string
  category: string
  names: string[]
  rng?: Rng
}

export const createGame = ({
  phrase,
  category,
  names,
  rng = Math.random,
}: CreateGameInput): GameState => {
  const slots = toSlots(phrase)
  const guessedLetters: Record<string, LetterState> = {}
  const letters = distinctLetters(phrase)

  // Opening freebie, no points. Skipped when it would reveal the whole phrase.
  if (letters.length > 1) {
    const opener = letters[Math.floor(rng() * letters.length)]
    for (const slot of slots) {
      if (normalizeLetter(slot.char) === opener) slot.revealed = true
    }
    guessedLetters[opener] = 'hit'
  }

  return {
    phase: 'playing',
    phrase,
    category,
    slots,
    players: createPlayers(names),
    activePlayerIndex: 0,
    guessedLetters,
    solvedBy: null,
    lastOutcome: null,
  }
}

const advanceTurn = (state: GameState): number =>
  (state.activePlayerIndex + 1) % state.players.length

const award = (state: GameState, points: number): Player[] =>
  state.players.map((player, index) =>
    index === state.activePlayerIndex
      ? { ...player, score: player.score + points }
      : player,
  )

export const guessLetter = (state: GameState, rawLetter: string): GameState => {
  if (state.phase !== 'playing') return state

  const letter = normalizeLetter(rawLetter)
  if (!isLetter(letter)) return state

  if (state.guessedLetters[letter]) {
    return {
      ...state,
      lastOutcome: { kind: 'rejected', letter, reason: 'already-guessed' },
    }
  }

  const occurrences = concealedCount(state.slots, letter)

  if (occurrences === 0) {
    return {
      ...state,
      guessedLetters: { ...state.guessedLetters, [letter]: 'miss' },
      activePlayerIndex: advanceTurn(state),
      lastOutcome: { kind: 'miss', letter },
    }
  }

  const slots = state.slots.map((slot) =>
    normalizeLetter(slot.char) === letter ? { ...slot, revealed: true } : slot,
  )

  return {
    ...state,
    slots,
    players: award(state, occurrences),
    guessedLetters: { ...state.guessedLetters, [letter]: 'hit' },
    phase: isGameOver(slots) ? 'over' : 'playing',
    lastOutcome: { kind: 'hit', letter, occurrences, points: occurrences },
  }
}

export const attemptSolve = (state: GameState, guess: string): GameState => {
  if (state.phase !== 'playing') return state

  if (normalizePhrase(guess) !== normalizePhrase(state.phrase)) {
    return {
      ...state,
      activePlayerIndex: advanceTurn(state),
      lastOutcome: { kind: 'solve-failed' },
    }
  }

  const remaining = state.slots.filter(
    (slot) => slot.isLetter && !slot.revealed,
  ).length
  const points = remaining + SOLVE_BONUS

  return {
    ...state,
    slots: state.slots.map((slot) => ({ ...slot, revealed: true })),
    players: award(state, points),
    phase: 'over',
    solvedBy: state.activePlayerIndex,
    lastOutcome: { kind: 'solved', points },
  }
}
