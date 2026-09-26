import { useCallback, useEffect, useReducer, useState } from 'react'
import { Board } from './components/Board'
import { GameOver } from './components/GameOver'
import { Keyboard } from './components/Keyboard'
import { Scoreboard } from './components/Scoreboard'
import { Setup } from './components/Setup'
import { ThemePicker } from './components/ThemePicker'
import { gameReducer, IDLE_STATE } from './game/reducer'
import {
  mergePlayerScores,
  readSavedScores,
  scoresForNames,
  writeSavedScores,
  type SavedScores,
} from './game/scores'
import type { GuessOutcome } from './game/types'
import { readSavedTheme, writeSavedTheme } from './theme'

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
    case 'revealed':
      return 'Phrase revealed. Game over.'
    case 'solve-failed':
      return 'Not the phrase. Turn passes.'
  }
}

const App = () => {
  const [state, dispatch] = useReducer(gameReducer, IDLE_STATE)
  const [roster, setRoster] = useState<string[]>(['', ''])
  const [savedScores, setSavedScores] = useState<SavedScores>(readSavedScores)
  const [theme, setTheme] = useState(readSavedTheme)
  const [solving, setSolving] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [solveGuess, setSolveGuess] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeSavedTheme(theme)
  }, [theme])

  useEffect(() => {
    if (state.players.length === 0) return

    writeSavedScores(mergePlayerScores(savedScores, state.players))
  }, [savedScores, state.players])

  useEffect(() => {
    writeSavedScores(savedScores)
  }, [savedScores])

  const activePlayer = state.players[state.activePlayerIndex]
  const savedPlayers = Object.entries(savedScores).map(
    ([, savedScore], index) => ({
      id: index,
      name: savedScore.name,
      score: savedScore.score,
    }),
  )

  const handleGuess = useCallback(
    (letter: string) => dispatch({ type: 'guess', letter }),
    [],
  )

  useEffect(() => {
    if (!state.lastOutcome || state.phase === 'over') return
    const timer = setTimeout(() => dispatch({ type: 'clearOutcome' }), 2600)
    return () => clearTimeout(timer)
  }, [state.lastOutcome, state.phase])

  const submitSolve = (event: React.FormEvent) => {
    event.preventDefault()
    dispatch({ type: 'solve', guess: solveGuess })
    setSolveGuess('')
    setSolving(false)
  }

  const confirmReveal = () => {
    dispatch({ type: 'reveal' })
    setRevealing(false)
  }

  const clearScores = () => {
    setSavedScores({})
    dispatch({ type: 'clearScores' })
  }

  const startGame = (phrase: string, category: string, names: string[]) => {
    setRoster(names)
    dispatch({
      type: 'start',
      phrase,
      category,
      names,
      scores: scoresForNames(names, savedScores),
    })
  }

  const playAgain = () => {
    setSavedScores(mergePlayerScores(savedScores, state.players))
    dispatch({ type: 'reset' })
    setSolving(false)
    setRevealing(false)
    setSolveGuess('')
  }

  if (state.phase === 'setup') {
    return (
      <main className="app" data-theme={theme}>
        <ThemePicker onThemeChange={setTheme} theme={theme} />
        {savedPlayers.length > 0 && (
          <Scoreboard
            activePlayerIndex={-1}
            ariaLabel="Saved scores"
            onClearScores={clearScores}
            players={savedPlayers}
          />
        )}
        <Setup initialNames={roster} onStart={startGame} />
      </main>
    )
  }

  return (
    <main className="app" data-theme={theme}>
      <ThemePicker onThemeChange={setTheme} theme={theme} />
      <Scoreboard
        activePlayerIndex={state.activePlayerIndex}
        onClearScores={clearScores}
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
            onReveal={() => setRevealing(true)}
            onSolve={() => setSolving(true)}
          />
        </>
      )}

      {solving && (
        <div
          aria-label="Solve the phrase"
          aria-modal="true"
          className="modal"
          role="dialog"
        >
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

      {revealing && (
        <div
          aria-label="Reveal the phrase"
          aria-modal="true"
          className="modal"
          role="dialog"
        >
          <div className="panel modal__panel">
            <h2 className="modal__heading">Reveal the phrase?</h2>
            <p className="modal__hint">
              The phrase will be shown and the game will end. No points will be
              awarded.
            </p>
            <div className="modal__actions">
              <button
                className="btn btn--ghost"
                onClick={() => setRevealing(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn--reveal"
                onClick={confirmReveal}
                type="button"
              >
                Reveal phrase
              </button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'over' && (
        <GameOver onPlayAgain={playAgain} state={state} />
      )}
    </main>
  )
}

export default App
