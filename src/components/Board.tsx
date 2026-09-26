import type { Slot } from '../game/types'

type Props = {
  slots: Slot[]
  category: string
}

/** Groups slots into words so wrapping never splits a word across lines. */
const toWords = (slots: Slot[]): Slot[][] =>
  slots.reduce<Slot[][]>(
    (words, slot) => {
      if (slot.char === ' ') {
        words.push([])
        return words
      }
      words[words.length - 1].push(slot)
      return words
    },
    [[]],
  )

export const Board = ({ slots, category }: Props) => {
  const words = toWords(slots)
  const readable = slots
    .map((slot) => (slot.revealed ? slot.char : 'blank'))
    .join(' ')

  return (
    <section className="board" aria-label="Phrase">
      <p className="board__category">{category}</p>
      <div className="board__words">
        {words.map((word, wordIndex) => (
          <div className="word" key={wordIndex}>
            {word.map((slot, slotIndex) => (
              <span
                aria-hidden="true"
                className={[
                  'tile',
                  slot.isLetter ? 'tile--letter' : 'tile--symbol',
                  slot.revealed ? 'tile--revealed' : 'tile--hidden',
                ].join(' ')}
                key={slotIndex}
              >
                {slot.revealed ? slot.char : ''}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {readable}
      </p>
    </section>
  )
}
