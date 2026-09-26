import type { Rng } from './engine'
import { CATEGORIES, TEMPLATES, type Template } from './phrases'
import type { Tier } from './types'
import { BANK_SUBJECTS, WORD_BANK, tierOfText } from './wordbank'

export type GeneratedPhrase = {
  phrase: string
  category: string
  tier: Tier
}

type PoolEntry = GeneratedPhrase & { sourceId: string }

export type SourceId = string
export type TierChoice = Tier | 'any'

/** Widen past the chosen tier rather than replay the same handful of entries. */
const MIN_POOL = 10

const expandTemplate = (template: Template): string[] => {
  const keys = [...template.pattern.matchAll(/\{(\w+)\}/gu)].map(
    (match) => match[1],
  )

  return keys.reduce<string[]>(
    (phrases, key) =>
      phrases.flatMap((phrase) =>
        (template.parts[key] ?? []).map((part) =>
          phrase.replace(`{${key}}`, part),
        ),
      ),
    [template.pattern],
  )
}

const POOL: PoolEntry[] = [
  ...WORD_BANK.map((entry) => ({
    phrase: entry.text,
    category:
      BANK_SUBJECTS.find((subject) => subject.id === entry.subject)?.label ??
      entry.subject,
    sourceId: entry.subject,
    tier: entry.tier,
  })),
  ...CATEGORIES.flatMap((category) =>
    category.phrases.map((phrase) => ({
      phrase,
      category: category.label,
      sourceId: category.id,
      tier: tierOfText(phrase),
    })),
  ),
  ...TEMPLATES.flatMap((template) =>
    expandTemplate(template).map((phrase) => ({
      phrase,
      category: template.label,
      sourceId: template.id,
      tier: tierOfText(phrase),
    })),
  ),
]

export const SOURCE_OPTIONS: { id: string; label: string; group: string }[] = [
  { id: 'any', label: 'Surprise me', group: 'All' },
  ...BANK_SUBJECTS.map((subject) => ({
    id: subject.id,
    label: subject.label,
    group: 'Words',
  })),
  ...CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    group: 'Phrases',
  })),
  ...TEMPLATES.map((template) => ({
    id: template.id,
    label: template.label,
    group: 'Made up',
  })),
]

export const TIER_OPTIONS: { id: TierChoice; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'fun', label: 'Fun' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Hard' },
  { id: 'challenging', label: 'Challenging' },
]

const pick = <T,>(items: readonly T[], rng: Rng): T =>
  items[Math.floor(rng() * items.length)]

const matching = (sourceId: SourceId, tier: TierChoice): PoolEntry[] =>
  POOL.filter(
    (entry) =>
      (sourceId === 'any' || entry.sourceId === sourceId) &&
      (tier === 'any' || entry.tier === tier),
  )

export const countFor = (sourceId: SourceId, tier: TierChoice): number =>
  matching(sourceId, tier).length

export const generatePhrase = (
  sourceId: SourceId = 'any',
  tier: TierChoice = 'any',
  rng: Rng = Math.random,
): GeneratedPhrase => {
  const exact = matching(sourceId, tier)

  let candidates = exact
  if (candidates.length < MIN_POOL) {
    const widerTier = matching(sourceId, 'any')
    candidates = widerTier.length >= MIN_POOL ? widerTier : matching('any', tier)
  }
  if (candidates.length === 0) candidates = POOL

  const chosen = pick(candidates, rng)
  return { phrase: chosen.phrase, category: chosen.category, tier: chosen.tier }
}
