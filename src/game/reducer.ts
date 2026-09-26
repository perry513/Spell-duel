import { attemptSolve, createGame, guessLetter, revealPhrase } from './engine'
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
  | {
      type: 'start'
      phrase: string
      category: string
      names: string[]
      scores?: number[]
    }
  | { type: 'guess'; letter: string }
  | { type: 'solve'; guess: string }
  | { type: 'reveal' }
  | { type: 'clearScores' }
  | { type: 'clearOutcome' }
  | { type: 'reset' }

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'start':
      return createGame({
        phrase: action.phrase,
        category: action.category,
        names: action.names,
        scores: action.scores,
      })
    case 'guess':
      return guessLetter(state, action.letter)
    case 'solve':
      return attemptSolve(state, action.guess)
    case 'reveal':
      return revealPhrase(state)
    case 'clearScores':
      return {
        ...state,
        players: state.players.map((player) => ({ ...player, score: 0 })),
      }
    case 'clearOutcome':
      return state.lastOutcome ? { ...state, lastOutcome: null } : state
    case 'reset':
      return IDLE_STATE
  }
}
