import { useState, type CSSProperties } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { validateNames, validatePhrase } from '../game/engine'
import {
  SOURCE_OPTIONS,
  TIER_OPTIONS,
  countFor,
  generatePhrase,
  type SourceId,
  type TierChoice,
} from '../game/generator'
import {
  PLAYER_COLORS,
  defaultPlayerColor,
  playerColorValue,
} from '../game/players'
import { MAX_PLAYERS, MIN_PLAYERS, type PlayerDraft } from '../game/types'

type Props = {
  initialPlayers: PlayerDraft[]
  initialTier: TierChoice
  onStart: (phrase: string, category: string, players: PlayerDraft[]) => void
  onTierChange: (tier: TierChoice) => void
}

export const Setup = ({
  initialPlayers,
  initialTier,
  onStart,
  onTierChange,
}: Props) => {
  const [players, setPlayers] = useState<PlayerDraft[]>(initialPlayers)
  const [source, setSource] = useState<SourceId>('any')
  const [tier, setTier] = useState<TierChoice>(initialTier)
  const [manual, setManual] = useState(false)
  const [manualPhrase, setManualPhrase] = useState('')
  const [showPhrase, setShowPhrase] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const names = players.map((player) => player.name)

  const setName = (index: number, value: string) => {
    setPlayers((current) =>
      current.map((player, i) =>
        i === index ? { ...player, name: value } : player,
      ),
    )
  }

  const setColor = (index: number, value: string) => {
    setPlayers((current) =>
      current.map((player, i) =>
        i === index ? { ...player, color: value } : player,
      ),
    )
  }

  const chooseTier = (value: TierChoice) => {
    setTier(value)
    onTierChange(value)
  }

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS)
      setPlayers((current) => [
        ...current,
        { name: '', color: defaultPlayerColor(current.length) },
      ])
  }

  const removePlayer = (index: number) => {
    if (players.length > MIN_PLAYERS)
      setPlayers((current) => current.filter((_, i) => i !== index))
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
      onStart(manualPhrase.trim(), 'Custom', players)
      return
    }

    const generated = generatePhrase(source, tier)
    onStart(generated.phrase, generated.category, players)
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
        {players.map((player, index) => (
          <div className="player-row" key={index}>
            <select
              aria-label={`Player ${index + 1} color`}
              className="input player-color"
              onChange={(event) => setColor(index, event.target.value)}
              style={
                {
                  '--player-color': playerColorValue(player.color),
                } as CSSProperties
              }
              value={player.color}
            >
              {PLAYER_COLORS.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.label}
                </option>
              ))}
            </select>
            <input
              aria-label={`Player ${index + 1} name`}
              autoComplete="off"
              className="input"
              maxLength={16}
              onChange={(event) => setName(index, event.target.value)}
              placeholder={`Player ${index + 1}`}
              value={player.name}
            />
            <button
              aria-label={`Remove player ${index + 1}`}
              className="btn btn--ghost"
              disabled={players.length <= MIN_PLAYERS}
              onClick={() => removePlayer(index)}
              type="button"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          className="btn btn--ghost"
          disabled={players.length >= MAX_PLAYERS}
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
              lang="en"
              onChange={(event) => setManualPhrase(event.target.value)}
              placeholder="Type a word or phrase"
              spellCheck={showPhrase}
              type={showPhrase ? 'text' : 'password'}
              value={manualPhrase}
            />
            <button
              className="btn btn--ghost manual__toggle"
              onClick={() => setShowPhrase((value) => !value)}
              type="button"
            >
              {showPhrase ? (
                <EyeOff aria-hidden="true" size={17} />
              ) : (
                <Eye aria-hidden="true" size={17} />
              )}
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
                  onClick={() => chooseTier(option.id)}
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