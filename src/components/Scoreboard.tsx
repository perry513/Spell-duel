import type { Player } from '../game/types'

type Props = {
  players: Player[]
  activePlayerIndex: number
}

export const Scoreboard = ({ players, activePlayerIndex }: Props) => (
  <section className="scoreboard" aria-label="Scores">
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
  </section>
)
