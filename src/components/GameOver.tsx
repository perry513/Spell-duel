import { winners } from '../game/engine'
import type { GameState } from '../game/types'

type Props = {
  state: GameState
  onPlayAgain: () => void
}

export const GameOver = ({ state, onPlayAgain }: Props) => {
  const champions = winners(state.players)
  const ranked = [...state.players].sort((a, b) => b.score - a.score)
  const solver =
    state.solvedBy === null ? null : state.players[state.solvedBy]

  return (
    <div className="panel gameover">
      <h2 className="gameover__heading">
        {champions.length > 1
          ? `It's a tie: ${champions.map((player) => player.name).join(' & ')}`
          : `${champions[0].name} wins`}
      </h2>

      <p className="gameover__phrase">{state.phrase}</p>
      {solver && (
        <p className="gameover__solver">Solved by {solver.name}</p>
      )}

      <ol className="standings">
        {ranked.map((player) => (
          <li className="standings__row" key={player.id}>
            <span>{player.name}</span>
            <span>{player.score}</span>
          </li>
        ))}
      </ol>

      <button
        className="btn btn--primary btn--block"
        onClick={onPlayAgain}
        type="button"
      >
        Play again
      </button>
    </div>
  )
}
