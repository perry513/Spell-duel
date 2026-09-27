import { useEffect, type CSSProperties } from 'react'
import type { LetterState } from '../game/types'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

const MARK: Record<LetterState, string> = {
  unused: '',
  hit: '✓',
  miss: '✕',
}

type Props = {
  guessedLetters: Record<string, LetterState>
  disabled: boolean
  onGuess: (letter: string) => void
  onReveal: () => void
  onSolve: () => void
  playerColor: string
}

export const Keyboard = ({
  guessedLetters,
  disabled,
  onGuess,
  onReveal,
  onSolve,
  playerColor,
}: Props) => {
  useEffect(() => {
    if (disabled) return

    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      const letter = event.key.toUpperCase()
      if (/^[A-Z]$/.test(letter)) onGuess(letter)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [disabled, onGuess])

  return (
    <section
      aria-label="Letter keyboard"
      className="keyboard"
      style={{ '--player-color': playerColor } as CSSProperties}
    >
      {ROWS.map((row) => (
        <div className="keyboard__row" key={row}>
          {[...row].map((letter) => {
            const state = guessedLetters[letter] ?? 'unused'
            const used = state !== 'unused'
            return (
              <button
                aria-disabled={used || disabled}
                aria-label={`${letter}${used ? `, ${state}` : ''}`}
                className={`key key--${state}`}
                disabled={used || disabled}
                key={letter}
                onClick={() => onGuess(letter)}
                type="button"
              >
                <span className="key__letter">{letter}</span>
                <span className="key__mark" aria-hidden="true">
                  {MARK[state]}
                </span>
              </button>
            )
          })}
        </div>
      ))}
      <div className="keyboard__actions">
        <button
          className="btn btn--solve"
          disabled={disabled}
          onClick={onSolve}
          type="button"
        >
          Type it! (Bonus)
        </button>
        <button
          className="btn btn--reveal"
          disabled={disabled}
          onClick={onReveal}
          type="button"
        >
          Reveal the phrase
        </button>
      </div>
    </section>
  )
}
