import { useCallback, useEffect, useReducer, useState } from 'react'
import { Board } from './components/Board'
import { GameOver } from './components/GameOver'
import { Keyboard } from './components/Keyboard'
import { Scoreboard } from './components/Scoreboard'
import { Setup } from './components/Setup'
import { gameReducer, IDLE_STATE } from './game/reducer'
import type { GuessOutcome } from './game/types'

const outcomeMessage = (outcome: GuessOutcome, playerName: string): string => {
  switch (outcome.kind) {
    case 'hit':
      return `${playerName} found ${outcome.occurrences} \u00d7 ${outcome.letter}. +${outcome.points}, go again.`
    case 'miss':
      return `No ${outcome.letter}. Turn passes.`
    case 'rejected':
      return `${outcome.letter} was already guessed \u2014 try another.`
    case 'solved':
      return `Solved for +${outcome.points}.`
    case 'solve-failed':
      return 'Not the phrase. Turn passes.'
  }
}

const App = () => {
  const [state, dispatch] = useReducer(gameReducer, IDLE_STATE)
  const [roster, setRoster] = useState<string[]>(['', ''])
  const [solving, setSolving] = useState(false)
  const [solveGuess, setSolveGuess] = useState('')

  const activePlayer = state.players[state.activePlayerIndex]

  const handleGuess = useCallback(
    (letter: string) => dispatch({ type: 'guess', letter }),
    [],
  )

  useEffect(() => {
    if (!state.lastOutcome) return
    const timer = setTimeout(() => dispatch({ type: 'clearOutcome' }), 2600)
    return () => clearTimeout(timer)
  }, [state.lastOutcome])

  const submitSolve = (event: React.FormEvent) => {
    event.preventDefault()
    dispatch({ type: 'solve', guess: solveGuess })
    setSolveGuess('')
    setSolving(false)
  }

  const playAgain = () => {
    dispatch({ type: 'reset' })
    setSolving(false)
    setSolveGuess('')
  }

  if (state.phase === 'setup') {
    return (
      <main className="app">
        <Setup
          initialNames={roster}
          onStart={(phrase, category, names) => {
            setRoster(names)
            dispatch({ type: 'start', phrase, category, names })
          }}
        />
      </main>
    )
  }

  return (
    <main className="app">
      <Scoreboard
        activePlayerIndex={state.activePlayerIndex}
        players={state.players}
      />

      <Board category={state.category} slots={state.slots} />

      {state.phase === 'playing' && (
        <>
          <p className="turn" aria-live="polite">
            <strong>{activePlayer.name}</strong> to guess
          </p>

          <p className="outcome" aria-live="assertive">
            {state.lastOutcome
              ? outcomeMessage(state.lastOutcome, activePlayer.name)
              : '\u00a0'}
          </p>

          <Keyboard
            disabled={solving}
            guessedLetters={state.guessedLetters}
            onGuess={handleGuess}
            onSolve={() => setSolving(true)}
          />
        </>
      )}

      {solving && (
        <div className="modal" role="dialog" aria-label="Solve the phrase">
          <form className="panel modal__panel" onSubmit={submitSolve}>
            <label className="modal__label" htmlFor="solve-input">
              {activePlayer.name}, type the full phrase
            </label>
            <input
              autoComplete="off"
              autoFocus
              className="input"
              id="solve-input"
              onChange={(event) => setSolveGuess(event.target.value)}
              value={solveGuess}
            />
            <p className="modal__hint">
              A wrong answer just passes the turn &mdash; no penalty.
            </p>
            <div className="modal__actions">
              <button
                className="btn btn--ghost"
                onClick={() => setSolving(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="btn btn--primary" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {state.phase === 'over' && (
        <GameOver onPlayAgain={playAgain} state={state} />
      )}
    </main>
  )
}

export default App
