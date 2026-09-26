import { attemptSolve, createGame, guessLetter } from './engine'
import type { GameState } from './types'

export const IDLE_STATE: GameState = {
  phase: 'setup',
  phrase: '',
  category: '',
  slots: [],
  players: [],
  activePlayerIndex: 0,
  guessedLetters: {},
  solvedBy: null,
  lastOutcome: null,
}

export type GameAction =
  | { type: 'start'; phrase: string; category: string; names: string[] }
  | { type: 'guess'; letter: string }
  | { type: 'solve'; guess: string }
  | { type: 'clearOutcome' }
  | { type: 'reset' }

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'start':
      return createGame({
        phrase: action.phrase,
        category: action.category,
        names: action.names,
      })
    case 'guess':
      return guessLetter(state, action.letter)
    case 'solve':
      return attemptSolve(state, action.guess)
    case 'clearOutcome':
      return state.lastOutcome ? { ...state, lastOutcome: null } : state
    case 'reset':
      return IDLE_STATE
  }
}
