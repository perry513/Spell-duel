import type { Tier } from './types'

export const TIER_ORDER: readonly Tier[] = ['fun', 'normal', 'hard', 'challenging']

/** Players try ETAOIN first, so these burn turns and drive difficulty. */
const RARE_LETTERS = new Set([...'JQXZKVWY'])

export const FAMILIARITY_CEILING = 6000

export const lettersOf = (word: string): string =>
  word.toUpperCase().replace(/[^A-Z]/gu, '')

export const distinctLettersOf = (word: string): string[] => [
  ...new Set(lettersOf(word)),
]

export const wordsOf = (phrase: string): string[] =>
  phrase.match(/[A-Za-z]+/gu) ?? []

/**
 * null rank means the word is absent from the frequency list. That list is
 * web-corpus derived, so everyday nouns like "badger" are often missing —
 * rank is therefore a weak nudge, not the dominant term.
 */
export const rankScore = (rank: number | null): number => {
  if (rank === null || rank > FAMILIARITY_CEILING) return 2
  if (rank > 2000) return 1
  return 0
}

export const distinctScore = (word: string): number => {
  const count = distinctLettersOf(word).length
  if (count >= 10) return 3
  if (count >= 8) return 2
  if (count >= 5) return 1
  return 0
}

export const rareScore = (word: string): number => {
  const count = distinctLettersOf(word).filter((letter) =>
    RARE_LETTERS.has(letter),
  ).length
  return Math.min(count, 2)
}

export const scoreWord = (word: string, rank: number | null): number =>
  rankScore(rank) + distinctScore(word) + rareScore(word)

export const tierFromScore = (score: number): Tier => {
  if (score >= 6) return 'challenging'
  if (score >= 4) return 'hard'
  if (score >= 2) return 'normal'
  return 'fun'
}

export const tierOfWord = (word: string, rank: number | null): Tier =>
  tierFromScore(scoreWord(word, rank))

export const maxTier = (tiers: Tier[]): Tier =>
  tiers.reduce(
    (hardest, tier) =>
      TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(hardest) ? tier : hardest,
    'fun' as Tier,
  )

/** A phrase is only as hard as its hardest word. */
export const tierOfPhrase = (
  phrase: string,
  lookup: (word: string) => Tier,
): Tier => {
  const words = wordsOf(phrase)
  if (words.length === 0) return 'fun'
  return maxTier(words.map(lookup))
}
