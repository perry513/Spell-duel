import { useState } from 'react'
import { validateNames, validatePhrase } from '../game/engine'
import {
  SOURCE_OPTIONS,
  TIER_OPTIONS,
  countFor,
  generatePhrase,
  type SourceId,
  type TierChoice,
} from '../game/generator'
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/types'

type Props = {
  initialNames: string[]
  onStart: (phrase: string, category: string, names: string[]) => void
}

export const Setup = ({ initialNames, onStart }: Props) => {
  const [names, setNames] = useState<string[]>(initialNames)
  const [source, setSource] = useState<SourceId>('any')
  const [tier, setTier] = useState<TierChoice>('any')
  const [manual, setManual] = useState(false)
  const [manualPhrase, setManualPhrase] = useState('')
  const [showPhrase, setShowPhrase] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setName = (index: number, value: string) => {
    setNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    )
  }

  const addPlayer = () => {
    if (names.length < MAX_PLAYERS) setNames((current) => [...current, ''])
  }

  const removePlayer = (index: number) => {
    if (names.length > MIN_PLAYERS)
      setNames((current) => current.filter((_, i) => i !== index))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    const nameError = validateNames(names)
    if (nameError) {
      setError(nameError)
      return
    }

    if (manual) {
      const phraseError = validatePhrase(manualPhrase)
      if (phraseError) {
        setError(phraseError)
        return
      }
      onStart(manualPhrase.trim(), 'Custom', names)
      return
    }

    const generated = generatePhrase(source, tier)
    onStart(generated.phrase, generated.category, names)
  }

  return (
    <form autoComplete="off" className="panel setup" onSubmit={submit}>
      <h1 className="setup__title">Spell Duel</h1>
      <p className="setup__tagline">
        Take turns guessing letters. Every letter you uncover is a point, and a
        correct guess keeps your turn alive.
      </p>

      <fieldset className="field">
        <legend>Players</legend>
        {names.map((name, index) => (
          <div className="player-row" key={index}>
            <input
              aria-label={`Player ${index + 1} name`}
              autoComplete="off"
              className="input"
              maxLength={16}
              onChange={(event) => setName(index, event.target.value)}
              placeholder={`Player ${index + 1}`}
              value={name}
            />
            <button
              aria-label={`Remove player ${index + 1}`}
              className="btn btn--ghost"
              disabled={names.length <= MIN_PLAYERS}
              onClick={() => removePlayer(index)}
              type="button"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          className="btn btn--ghost"
          disabled={names.length >= MAX_PLAYERS}
          onClick={addPlayer}
          type="button"
        >
          + Add player
        </button>
      </fieldset>

      <fieldset className="field">
        <legend>Phrase</legend>
        <label className="toggle">
          <input
            checked={manual}
            onChange={(event) => setManual(event.target.checked)}
            type="checkbox"
          />
          <span>I&rsquo;ll type my own phrase</span>
        </label>

        {manual ? (
          <div className="manual">
            <input
              aria-label="Custom phrase"
              autoComplete="new-password"
              className="input"
              onChange={(event) => setManualPhrase(event.target.value)}
              placeholder="Type a word or phrase"
              type={showPhrase ? 'text' : 'password'}
              value={manualPhrase}
            />
            <button
              className="btn btn--ghost"
              onClick={() => setShowPhrase((value) => !value)}
              type="button"
            >
              {showPhrase ? 'Hide' : 'Show'}
            </button>
          </div>
        ) : (
          <>
            <select
              aria-label="Phrase category"
              className="input"
              onChange={(event) => setSource(event.target.value)}
              value={source}
            >
              {[...new Set(SOURCE_OPTIONS.map((option) => option.group))].map(
                (group) => (
                  <optgroup key={group} label={group}>
                    {SOURCE_OPTIONS.filter(
                      (option) => option.group === group,
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ),
              )}
            </select>

            <div className="tiers" role="group" aria-label="Difficulty">
              {TIER_OPTIONS.map((option) => (
                <button
                  aria-pressed={tier === option.id}
                  className={`tier ${tier === option.id ? 'tier--on' : ''}`}
                  key={option.id}
                  onClick={() => setTier(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="hint">
              {countFor(source, tier)} to choose from
              {countFor(source, tier) < 10 && tier !== 'any'
                ? ' — too few, so other difficulties will be mixed in'
                : ''}
            </p>
          </>
        )}
      </fieldset>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn--primary btn--block" type="submit">
        Start game
      </button>
    </form>
  )
}
