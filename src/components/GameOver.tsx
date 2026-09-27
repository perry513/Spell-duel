import { Globe, Undo2 } from 'lucide-react'
import { winners } from '../game/engine'
import type { GameState } from '../game/types'

type Props = {
  state: GameState
  canUndo: boolean
  onPlayAgain: () => void
  onUndo: () => void
}

export const GameOver = ({ state, canUndo, onPlayAgain, onUndo }: Props) => {
  const champions = winners(state.players)
  const ranked = [...state.players].sort((a, b) => b.score - a.score)
  const solver =
    state.solvedBy === null ? null : state.players[state.solvedBy]
  const meaningSearch = new URL('https://www.google.com/search')
  meaningSearch.searchParams.set('q', `define ${state.phrase}`)

  return (
    <div className="panel gameover">
      <h2 className="gameover__heading">
        {champions.length > 1
          ? `It's a tie: ${champions.map((player) => player.name).join(' & ')}`
          : `${champions[0].name} wins`}
      </h2>

      <p className="gameover__phrase">{state.phrase}</p>
      <a
        className="gameover__meaning-link"
        href={meaningSearch.toString()}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Globe aria-hidden="true" size={16} strokeWidth={2} />
        Search meaning on Google
      </a>
      {solver && (
        <p className="gameover__solver">Solved by {solver.name}</p>
      )}
      {state.lastOutcome?.kind === 'revealed' && (
        <p className="gameover__solver">Phrase revealed. No points awarded.</p>
      )}

      <ol className="standings">
        {ranked.map((player) => (
          <li className="standings__row" key={player.id}>
            <span>{player.name}</span>
            <span>{player.score}</span>
          </li>
        ))}
      </ol>

      {canUndo && (
        <button
          className="btn btn--ghost btn--block gameover__undo"
          onClick={onUndo}
          type="button"
        >
          <Undo2 aria-hidden="true" size={16} />
          Undo last move
        </button>
      )}

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
