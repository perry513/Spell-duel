import { Trash2 } from 'lucide-react'
import type { Player } from '../game/types'

type Props = {
  players: Player[]
  activePlayerIndex: number
  ariaLabel?: string
  onClearScores?: () => void
}

export const Scoreboard = ({
  players,
  activePlayerIndex,
  ariaLabel = 'Scores',
  onClearScores,
}: Props) => (
  <section className="scoreboard" aria-label={ariaLabel}>
    {players.map((player, index) => {
      const active = index === activePlayerIndex
      return (
        <div
          className={`score ${active ? 'score--active' : ''}`}
          key={player.id}
        >
          <span className="score__name">{player.name}</span>
          <span className="score__points">{player.score}</span>
          {active && <span className="sr-only">current turn</span>}
        </div>
      )
    })}
    {onClearScores && (
      <button
        aria-label="Clear scores"
        className="btn scoreboard__clear"
        onClick={onClearScores}
        title="Clear saved scores"
        type="button"
      >
        <Trash2 aria-hidden="true" size={19} />
      </button>
    )}
  </section>
)
