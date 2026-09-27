import { describe, expect, it } from 'vitest'
import {
  attemptSolve,
  createGame,
  guessLetter,
  revealPhrase,
  undoLastMove,
  winners,
} from './engine'
import { SOLVE_BONUS, type GameState } from './types'

/** Deterministic RNG so the opening reveal is always the first distinct letter. */
const firstLetter = () => 0

const newGame = (phrase: string, names = ['Ann', 'Bob']): GameState =>
  createGame({ phrase, category: 'Test', names, rng: firstLetter })

const concealed = (state: GameState) =>
  state.slots.filter((slot) => slot.isLetter && !slot.revealed).length

describe('createGame', () => {
  it('reveals one opening letter and awards no points', () => {
    const state = newGame('BANANA SPLIT')

    expect(state.guessedLetters).toEqual({ B: 'hit' })
    expect(state.players.every((player) => player.score === 0)).toBe(true)
  })

  it('leaves non-letters visible from the start', () => {
    const state = newGame("IT'S A TRAP")
    const space = state.slots.find((slot) => slot.char === ' ')
    const apostrophe = state.slots.find((slot) => slot.char === "'")

    expect(space?.revealed).toBe(true)
    expect(apostrophe?.revealed).toBe(true)
  })

  it('pads missing names and caps the roster at six', () => {
    const state = newGame('HELLO WORLD', ['', 'Bo', 'C', 'D', 'E', 'F', 'G'])

    expect(state.players).toHaveLength(6)
    expect(state.players[0].name).toBe('Player 1')
  })

  it('starts players with persisted scores when provided', () => {
    const state = createGame({
      phrase: 'HELLO WORLD',
      category: 'Test',
      names: ['Ann', 'Bob'],
      scores: [7, 3],
      rng: firstLetter,
    })

    expect(state.players.map((player) => player.score)).toEqual([7, 3])
  })

  it('starts with the given player and keeps their colours', () => {
    const state = createGame({
      phrase: 'BANANA SPLIT',
      category: 'Test',
      names: ['Ann', 'Bob'],
      colors: ['pink', 'teal'],
      startingPlayerIndex: 1,
      rng: firstLetter,
    })

    expect(state.activePlayerIndex).toBe(1)
    expect(state.players.map((player) => player.color)).toEqual([
      'pink',
      'teal',
    ])
  })

  it('falls back to the first player when the starting index is missing', () => {
    const state = createGame({
      phrase: 'BANANA SPLIT',
      category: 'Test',
      names: ['Ann', 'Bob'],
      startingPlayerIndex: 9,
      rng: firstLetter,
    })

    expect(state.activePlayerIndex).toBe(0)
  })
})

describe('guessLetter', () => {
  it('scores one point per occurrence and keeps the turn', () => {
    const state = guessLetter(newGame('BANANA SPLIT'), 'A')

    expect(state.players[0].score).toBe(3)
    expect(state.activePlayerIndex).toBe(0)
    expect(state.lastOutcome).toMatchObject({ kind: 'hit', occurrences: 3 })
  })

  it('passes the turn on a miss without a penalty', () => {
    const state = guessLetter(newGame('BANANA SPLIT'), 'Z')

    expect(state.players[0].score).toBe(0)
    expect(state.activePlayerIndex).toBe(1)
    expect(state.lastOutcome).toMatchObject({ kind: 'miss' })
  })

  it('rejects an already-guessed letter without costing the turn', () => {
    const state = guessLetter(guessLetter(newGame('BANANA SPLIT'), 'A'), 'A')

    expect(state.players[0].score).toBe(3)
    expect(state.activePlayerIndex).toBe(0)
    expect(state.lastOutcome).toMatchObject({ kind: 'rejected' })
  })

  it('is case-insensitive', () => {
    expect(guessLetter(newGame('BANANA SPLIT'), 'a').players[0].score).toBe(3)
  })

  it('wraps the turn back to the first player', () => {
    const state = guessLetter(guessLetter(newGame('BANANA SPLIT'), 'Z'), 'Q')

    expect(state.activePlayerIndex).toBe(0)
  })

  it('ends the game once the last letter is revealed', () => {
    const state = guessLetter(newGame('ABBA'), 'B')

    expect(state.phase).toBe('over')
    expect(concealed(state)).toBe(0)
  })
})

describe('attemptSolve', () => {
  it('awards the remaining letters plus the bonus', () => {
    const start = newGame('BANANA SPLIT')
    const remaining = concealed(start)
    const state = attemptSolve(start, 'banana split')

    expect(state.phase).toBe('over')
    expect(state.solvedBy).toBe(0)
    expect(state.players[0].score).toBe(remaining + SOLVE_BONUS)
  })

  it('ignores casing and extra whitespace', () => {
    const state = attemptSolve(newGame('BANANA SPLIT'), '  Banana   Split ')

    expect(state.phase).toBe('over')
  })

  it('passes the turn on a wrong answer with no penalty', () => {
    const state = attemptSolve(newGame('BANANA SPLIT'), 'apple pie')

    expect(state.phase).toBe('playing')
    expect(state.players[0].score).toBe(0)
    expect(state.activePlayerIndex).toBe(1)
  })
})

describe('revealPhrase', () => {
  it('reveals every slot and ends without changing scores', () => {
    const start = guessLetter(newGame('BANANA SPLIT'), 'A')
    const state = revealPhrase(start)

    expect(state.phase).toBe('over')
    expect(state.slots.every((slot) => slot.revealed)).toBe(true)
    expect(state.players).toEqual(start.players)
    expect(state.solvedBy).toBeNull()
    expect(state.lastOutcome).toEqual({ kind: 'revealed' })
  })
})

describe('undoLastMove', () => {
  it('takes back a guess, restoring the score and the turn', () => {
    const start = newGame('BANANA SPLIT')
    const state = undoLastMove(guessLetter(start, 'Z'))

    expect(state.activePlayerIndex).toBe(start.activePlayerIndex)
    expect(state.guessedLetters).toEqual(start.guessedLetters)
    expect(state.players).toEqual(start.players)
  })

  it('reopens a game that was ended by a reveal', () => {
    const start = newGame('BANANA SPLIT')
    const state = undoLastMove(revealPhrase(start))

    expect(state.phase).toBe('playing')
    expect(concealed(state)).toBe(concealed(start))
  })

  it('does nothing when there is no history', () => {
    const start = newGame('BANANA SPLIT')

    expect(undoLastMove(start)).toBe(start)
  })
})

describe('winners', () => {
  it('returns every player tied at the top score', () => {
    const tied = winners([
      { id: 0, name: 'Ann', score: 4, color: 'blue' },
      { id: 1, name: 'Bob', score: 4, color: 'pink' },
      { id: 2, name: 'Cal', score: 1, color: 'green' },
    ])

    expect(tied.map((player) => player.name)).toEqual(['Ann', 'Bob'])
  })
})
