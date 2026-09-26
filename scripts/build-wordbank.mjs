// Builds src/game/wordbank.generated.ts from curated CC0 category lists.
// The frequency list is used ONLY to rank words for difficulty, never to pick them —
// raw web-frequency words are stopwords and business jargon, not kid vocabulary.
// Run with: npm run build:wordbank
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { TIER_ORDER, tierOfPhrase, tierOfWord } from '../src/game/difficulty.ts'

const here = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(here, '.cache')
const outFile = join(here, '..', 'src', 'game', 'wordbank.generated.ts')
const reviewFile = join(cacheDir, 'wordbank-review.txt')

const CORPORA = 'https://raw.githubusercontent.com/dariusk/corpora/master/data'

const FREQUENCY_URL =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt'
const PROFANITY_URL =
  'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en'
const DICTIONARY_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'

// Subject -> corpora files. Each file is CC0 and roughly 100-1000 entries.
// `strict` marks encyclopedic lists (every genus, job title, element) where an
// entry must also appear in the frequency list to prove it is commonly known.
const SUBJECTS = [
  {
    id: 'animals',
    label: 'Animals',
    files: [{ path: 'animals/common.json' }],
  },
  {
    id: 'food',
    label: 'Food',
    files: [
      { path: 'foods/fruits.json' },
      { path: 'foods/vegetables.json' },
      { path: 'foods/breads_and_pastries.json' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    files: [
      { path: 'plants/flowers.json' },
      { path: 'plants/plants.json', strict: true },
      { path: 'science/weather_conditions.json' },
      { path: 'geography/geographic_features.json', strict: true },
    ],
  },
  {
    id: 'people',
    label: 'People',
    files: [
      { path: 'humans/bodyParts.json' },
      { path: 'humans/familyRelations.json' },
      { path: 'humans/occupations.json', strict: true },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    files: [
      { path: 'objects/objects.json' },
      { path: 'objects/clothing.json' },
      { path: 'objects/containers.json' },
      { path: 'architecture/rooms.json' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    files: [{ path: 'sports/sports.json', strict: true }],
  },
  { id: 'music', label: 'Music', files: [{ path: 'music/instruments.json' }] },
  {
    id: 'science',
    label: 'Science',
    files: [
      { path: 'science/elements.json', strict: true },
      { path: 'science/planets.json' },
    ],
  },
  {
    id: 'world',
    label: 'World',
    files: [
      { path: 'geography/countries.json' },
      { path: 'geography/oceans.json' },
    ],
  },
]

// 'species' is excluded so Latin binomials in plants.json never reach the game.
const META_KEYS = new Set([
  'description',
  'source',
  'url',
  'license',
  'note',
  'credit',
  'species',
])

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

const MIN_LENGTH = 3
const MAX_LENGTH = 20
const MAX_WORDS = 2

const download = async (url, file) => {
  const path = join(cacheDir, file)
  if (existsSync(path)) return readFile(path, 'utf8')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed ${response.status} for ${url}`)
  const text = await response.text()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, text, 'utf8')
  return text
}

const toLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

/** Corpora files vary in shape, so pull every string except metadata fields. */
const collectStrings = (value) => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => !META_KEYS.has(key))
      .flatMap(([, nested]) => collectStrings(nested))
  }
  return []
}

const main = async () => {
  await mkdir(cacheDir, { recursive: true })

  const frequencyText = await download(FREQUENCY_URL, 'frequency.txt')
  const profanityText = await download(PROFANITY_URL, 'profanity.txt')
  const dictionaryText = await download(DICTIONARY_URL, 'words_alpha.txt')
  const topicsText = await readFile(join(here, 'blocklist-topics.txt'), 'utf8')

  const ranked = toLines(frequencyText)
  const ranks = new Map(ranked.map((word, index) => [word, index + 1]))
  const profanity = new Set(toLines(profanityText))
  const topics = new Set(toLines(topicsText))
  const dictionary = new Set(toLines(dictionaryText))

  const lookup = (word) =>
    tierOfWord(word, ranks.get(word.toLowerCase()) ?? null)

  const rejected = {
    shape: 0,
    length: 0,
    tooManyWords: 0,
    stopword: 0,
    notAWord: 0,
    obscure: 0,
    profanity: 0,
    topic: 0,
    duplicate: 0,
  }
  const seen = new Set()
  const entries = []

  console.log('Subjects')
  for (const subject of SUBJECTS) {
    let kept = 0
    for (const file of subject.files) {
      const raw = await download(`${CORPORA}/${file.path}`, join('corpora', file.path))
      const candidates = collectStrings(JSON.parse(raw))

      for (const candidate of candidates) {
        const text = candidate.trim().replace(/\s+/gu, ' ')
        const key = text.toLowerCase()
        const words = key.split(/[^a-z]+/u).filter(Boolean)

        if (!/^[A-Za-z][A-Za-z' -]*$/u.test(text)) {
          rejected.shape += 1
          continue
        }
        if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
          rejected.length += 1
          continue
        }
        if (words.length > MAX_WORDS) {
          rejected.tooManyWords += 1
          continue
        }
        if (words.some((word) => STOPWORDS.has(word))) {
          rejected.stopword += 1
          continue
        }
        if (words.some((word) => !dictionary.has(word))) {
          rejected.notAWord += 1
          continue
        }
        if (file.strict && words.some((word) => !ranks.has(word))) {
          rejected.obscure += 1
          continue
        }
        if (words.some((word) => profanity.has(word))) {
          rejected.profanity += 1
          continue
        }
        if (words.some((word) => topics.has(word))) {
          rejected.topic += 1
          continue
        }
        if (seen.has(key)) {
          rejected.duplicate += 1
          continue
        }

        seen.add(key)
        entries.push({
          text,
          subject: subject.id,
          tier: tierOfPhrase(text, lookup),
        })
        kept += 1
      }
    }
    console.log(`  ${subject.label.padEnd(10)} ${String(kept).padStart(5)}`)
  }

  entries.sort(
    (a, b) => a.subject.localeCompare(b.subject) || a.text.localeCompare(b.text),
  )

  const subjectLines = SUBJECTS.map(
    (subject) => `  { id: '${subject.id}', label: '${subject.label}' },`,
  ).join('\n')

  const entryLines = entries
    .map(
      (entry) =>
        `  { text: '${entry.text.replace(/'/gu, "\\'")}', subject: '${entry.subject}', tier: '${entry.tier}' },`,
    )
    .join('\n')

  const generated = `// GENERATED by scripts/build-wordbank.mjs - do not edit by hand.
// Run \`npm run build:wordbank\` to regenerate.
// Words: dariusk/corpora (CC0). Ranking: first20hours/google-10000-english.
import type { Tier } from './types'

export type BankEntry = {
  readonly text: string
  readonly subject: string
  readonly tier: Tier
}

export const BANK_SUBJECTS: readonly { id: string; label: string }[] = [
${subjectLines}
]

export const WORD_BANK: readonly BankEntry[] = [
${entryLines}
]
`

  await writeFile(outFile, generated, 'utf8')

  const byTier = Object.fromEntries(TIER_ORDER.map((tier) => [tier, []]))
  for (const entry of entries) byTier[entry.tier].push(entry.text)

  const review = TIER_ORDER.map(
    (tier) =>
      `== ${tier} (${byTier[tier].length}) ==\n${byTier[tier].join('\n')}`,
  ).join('\n\n')
  await writeFile(reviewFile, review, 'utf8')

  console.log('\nRejected')
  for (const [reason, count] of Object.entries(rejected)) {
    console.log(`  ${reason.padEnd(10)} ${String(count).padStart(5)}`)
  }

  console.log(`\nTiers (${entries.length} entries)`)
  for (const tier of TIER_ORDER) {
    console.log(
      `  ${tier.padEnd(12)} ${String(byTier[tier].length).padStart(5)}  ${byTier[tier].slice(0, 10).join(', ')}`,
    )
  }

  console.log(`\nWrote  ${outFile}`)
  console.log(`Review ${reviewFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
