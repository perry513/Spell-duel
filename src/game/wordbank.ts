import { tierOfPhrase, tierOfWord, wordsOf } from './difficulty'
import type { Tier } from './types'
import { BANK_SUBJECTS, WORD_BANK } from './wordbank.generated'

export { BANK_SUBJECTS, WORD_BANK }

// Keyed on single tokens so lookups line up with how tierOfPhrase splits text;
// "t-shirt" is two tokens and so is scored per word instead.
const WORD_TIERS = new Map<string, Tier>(
  WORD_BANK.filter((entry) => wordsOf(entry.text).length === 1).map((entry) => [
    wordsOf(entry.text)[0].toLowerCase(),
    entry.tier,
  ]),
)

const lookupWord = (word: string): Tier =>
  WORD_TIERS.get(word.toLowerCase()) ?? tierOfWord(word, null)

/** Tiers any text, including phrases the player typed themselves. */
export const tierOfText = (text: string): Tier => tierOfPhrase(text, lookupWord)
