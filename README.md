# Spell Duel

A hot-seat word guessing game for 2&ndash;6 players sharing one screen.

## How to play

- A word or phrase starts concealed; the number of characters is visible.
- One letter is revealed for free at the start &mdash; nobody scores for it.
- Players take turns guessing a letter from the on-screen keyboard.
- A correct guess reveals every occurrence and scores **1 point per occurrence**,
  and that player guesses again.
- A wrong guess passes the turn. There is no penalty.
- Guessing a letter that has already been tried is rejected without losing the turn.
- Any player may try to **solve the phrase**: correct scores 1 point per still-hidden
  letter plus a 5-point bonus and ends the game; wrong just passes the turn.
- The game ends when every letter is revealed. Highest score wins; ties are shared.

Phrases come from a bundled word bank of ~2,100 kid-appropriate words and phrases
across nine subjects, a set of hand-written curriculum terms (science, maths,
geography, history), and procedural templates. You can also type your own with a
masked input.

## Difficulty

Every word is scored once at build time and sorted into **fun**, **normal**,
**hard** or **challenging**. A phrase takes the tier of its hardest word, so
"banana split" is normal because "split" is.

The score adds three things:

- how common the word is (rare *words* are excluded, not made harder)
- how many distinct letters it has &mdash; `banana` has only three
- how many rare letters (J Q X Z K V W Y) it contains

Length deliberately counts for nothing: longer words expose more letters per
correct guess, so they are usually easier, not harder.

## Development

```bash
npm install
npm run dev             # dev server at /spell-duel/
npm test                # engine and difficulty tests
npm run build           # type-check and bundle
npm run build:wordbank  # regenerate the word bank (needs network)
npm run preview         # serve the production build
```

`npm run build:wordbank` downloads its sources once into `scripts/.cache/`,
filters them, scores them, and writes `src/game/wordbank.generated.ts`. That
generated file is committed, so ordinary builds and CI never need the network.
It also writes `scripts/.cache/wordbank-review.txt` for eyeballing the full list
before committing.

## Layout

- `src/game/` &mdash; pure, framework-free game rules. `engine.ts` holds all scoring
  and turn logic, `difficulty.ts` the tier scoring, `generator.ts` phrase selection.
- `src/components/` &mdash; presentation only.
- `src/App.tsx` &mdash; wires the engine to the UI through `useReducer`.
- `scripts/` &mdash; the word bank pipeline and its topic blocklist.

## Credits

Word data is downloaded at build time and redistributed in the generated bank:

- [dariusk/corpora](https://github.com/dariusk/corpora) &mdash; category word lists, CC0
- [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english)
  &mdash; word frequency ranking
- [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
  &mdash; profanity blocklist, CC-BY-4.0
- [dwyl/english-words](https://github.com/dwyl/english-words) &mdash; dictionary check
  only, not shipped, Unlicense

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The Vite `base` is `/spell-duel/`; change it in
`vite.config.ts` if the repository is renamed.
