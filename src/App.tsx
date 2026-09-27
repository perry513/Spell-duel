import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  type CSSProperties,
} from 'react'
import { Undo2 } from 'lucide-react'
import { Board } from './components/Board'
import { GameOver } from './components/GameOver'
import { Keyboard } from './components/Keyboard'
import { Scoreboard } from './components/Scoreboard'
import { Setup } from './components/Setup'
import { ThemePicker } from './components/ThemePicker'
import { winners } from './game/engine'
import type { TierChoice } from './game/generator'
import { defaultPlayerColor, playerColorValue } from './game/players'
import {
  readPreferences,
  savePreferences,
  startingIndexFor,
} from './game/preferences'
import { gameReducer, IDLE_STATE } from './game/reducer'
import {
  mergePlayerScores,
  readSavedScores,
  scoresForNames,
  writeSavedScores,
  type SavedScores,
} from './game/scores'
import type { GuessOutcome, PlayerDraft } from './game/types'
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
  const [preferences, setPreferences] = useState(readPreferences)
  const [roster, setRoster] = useState<PlayerDraft[]>(() =>
    [0, 1].map((index) => ({
      name: '',
      color: preferences.colors[index] ?? defaultPlayerColor(index),
    })),
  )
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

  useEffect(() => {
    if (state.phase !== 'over') return

    const champions = winners(state.players)
    if (champions.length !== 1 || champions[0].score === 0) return

    savePreferences({ lastWinner: champions[0].name })
  }, [state.phase, state.players])

  const activePlayer = state.players[state.activePlayerIndex]
  const canUndo = state.history.length > 0
  const savedPlayers = Object.entries(savedScores).map(
    ([, savedScore], index) => ({
      id: index,
      name: savedScore.name,
      score: savedScore.score,
      color: defaultPlayerColor(index),
    }),
  )

  const handleGuess = useCallback(
    (letter: string) => dispatch({ type: 'guess', letter }),
    [],
  )

  const undoMove = useCallback(() => dispatch({ type: 'undo' }), [])

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

  const startGame = (
    phrase: string,
    category: string,
    players: PlayerDraft[],
  ) => {
    setRoster(players)

    const names = players.map((player) => player.name)
    const colors = players.map((player) => player.color)
    const saved = savePreferences({ colors })
    setPreferences(saved)

    dispatch({
      type: 'start',
      phrase,
      category,
      names,
      colors,
      scores: scoresForNames(names, savedScores),
      startingPlayerIndex: startingIndexFor(names, saved.lastWinner),
    })
  }

  const chooseTier = (tier: TierChoice) =>
    setPreferences(savePreferences({ tier }))

  const goHome = () => {
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
        <Setup
          initialPlayers={roster}
          initialTier={preferences.tier}
          onStart={startGame}
          onTierChange={chooseTier}
        />
      </main>
    )
  }

  return (
    <main
      className="app"
      data-theme={theme}
      style={
        {
          '--player-color': playerColorValue(activePlayer.color),
        } as CSSProperties
      }
    >
      <ThemePicker onHome={goHome} onThemeChange={setTheme} theme={theme} />
      <Scoreboard
        activePlayerIndex={state.activePlayerIndex}
        onClearScores={clearScores}
        players={state.players}
      />

      <Board category={state.category} slots={state.slots} />

      {state.phase === 'playing' && (
        <>
          <p
            className="turn"
            aria-live="polite"
          >
            <strong className="turn__name">{activePlayer.name}</strong>&rsquo;s turn
          </p>

          <div className="outcome-row">
            <p className="outcome" aria-live="assertive">
              {state.lastOutcome
                ? outcomeMessage(state.lastOutcome, activePlayer.name)
                : '\u00a0'}
            </p>
            {canUndo && (
              <button
                className="btn btn--undo"
                onClick={undoMove}
                type="button"
              >
                <Undo2 aria-hidden="true" size={15} />
                Undo
              </button>
            )}
          </div>

          <Keyboard
            disabled={solving}
            guessedLetters={state.guessedLetters}
            onGuess={handleGuess}
            onReveal={() => setRevealing(true)}
            onSolve={() => setSolving(true)}
            playerColor={playerColorValue(activePlayer.color)}
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
        <GameOver
          canUndo={canUndo}
          onPlayAgain={goHome}
          onUndo={undoMove}
          state={state}
        />
      )}
    </main>
  )
}

export default App
