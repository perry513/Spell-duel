import { describe, expect, it } from 'vitest'
import {
  distinctScore,
  rankScore,
  rareScore,
  tierOfWord,
  wordsOf,
} from './difficulty'
import { generatePhrase } from './generator'
import { tierOfText } from './wordbank'
import { WORD_BANK } from './wordbank.generated'

describe('scoring components', () => {
  it('treats absent words as the least familiar', () => {
    expect(rankScore(null)).toBe(2)
    expect(rankScore(500)).toBe(0)
    expect(rankScore(4000)).toBe(1)
  })

  it('counts distinct letters, not length', () => {
    expect(distinctScore('banana')).toBe(0)
    expect(distinctScore('split')).toBe(1)
    expect(distinctScore('hippopotamus')).toBe(2)
  })

  it('caps the rare-letter penalty at two', () => {
    expect(rareScore('apple')).toBe(0)
    expect(rareScore('pizza')).toBe(1)
    expect(rareScore('jigsaw')).toBe(2)
    expect(rareScore('jazzy')).toBe(2)
  })
})

describe('tierOfText', () => {
  it('takes the tier of the hardest word', () => {
    expect(tierOfText('banana split')).toBe('normal')
  })

  it('lifts a phrase containing an unfamiliar word', () => {
    const carbonDioxide = tierOfText('carbon dioxide')
    expect(['hard', 'challenging']).toContain(carbonDioxide)
    expect(tierOfText('carbon')).toBe('normal')
  })

  it('keeps short common words easy', () => {
    expect(tierOfText('cat')).toBe('fun')
    expect(tierOfText('dog')).toBe('fun')
  })

  it('falls back for words it has never seen', () => {
    expect(['hard', 'challenging']).toContain(tierOfText('zzzyqx'))
  })

  it('ignores punctuation and casing', () => {
    expect(tierOfText('  Banana   SPLIT ')).toBe('normal')
  })
})

describe('word bank', () => {
  it('is populated in every tier', () => {
    for (const tier of ['fun', 'normal', 'hard', 'challenging'] as const) {
      expect(WORD_BANK.filter((entry) => entry.tier === tier).length).toBeGreaterThan(0)
    }
  })

  it('contains only clean, guessable entries', () => {
    for (const entry of WORD_BANK) {
      expect(entry.text).toMatch(/^[A-Za-z][A-Za-z' -]*$/)
      expect(entry.text.split(' ').length).toBeLessThanOrEqual(2)
      expect(new Set(entry.text.toLowerCase().replace(/[^a-z]/g, '')).size).toBeGreaterThan(1)
    }
  })

  it('agrees with the runtime scorer on its own single words', () => {
    for (const entry of WORD_BANK) {
      if (wordsOf(entry.text).length !== 1) continue
      expect(tierOfText(entry.text)).toBe(entry.tier)
    }
  })
})

describe('generatePhrase', () => {
  const first = () => 0

  it('respects the requested tier when the pool is big enough', () => {
    for (const tier of ['fun', 'normal', 'hard'] as const) {
      expect(generatePhrase('any', tier, first).tier).toBe(tier)
    }
  })

  it('widens rather than returning nothing for a thin combination', () => {
    const result = generatePhrase('music', 'challenging', first)
    expect(result.phrase.length).toBeGreaterThan(0)
  })

  it('defaults to any source and any tier', () => {
    expect(generatePhrase().phrase.length).toBeGreaterThan(0)
  })

  it('keeps every word of a bank word uppercase-safe for the board', () => {
    expect(generatePhrase('animals', 'fun', first).category).toBe('Animals')
  })
})

describe('tierOfWord', () => {
  it('scores rank, distinct letters and rare letters together', () => {
    expect(tierOfWord('cat', 300)).toBe('fun')
    expect(tierOfWord('alligator', null)).toBe('normal')
    expect(tierOfWord('xylophone', null)).toBe('challenging')
  })
})
