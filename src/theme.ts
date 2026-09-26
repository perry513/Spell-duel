export type ThemeId =
  | 'midnight'
  | 'candy-pop'
  | 'sunshine'
  | 'ocean-splash'
  | 'jungle-jump'

export type ThemeOption = {
  id: ThemeId
  label: string
  description: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Cool and cosmic',
  },
  {
    id: 'candy-pop',
    label: 'Candy Pop',
    description: 'Pink, peach, and mint',
  },
  {
    id: 'sunshine',
    label: 'Sunshine',
    description: 'Golden and full of sparkle',
  },
  {
    id: 'ocean-splash',
    label: 'Ocean Splash',
    description: 'Breezy blue and coral',
  },
  {
    id: 'jungle-jump',
    label: 'Jungle Jump',
    description: 'Leafy green and zesty',
  },
]

const THEME_STORAGE_KEY = 'spell-duel:theme'

export const readSavedTheme = (): ThemeId => {
  if (typeof window === 'undefined') return 'candy-pop'

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_OPTIONS.some((option) => option.id === savedTheme)
      ? (savedTheme as ThemeId)
      : 'candy-pop'
  } catch {
    return 'candy-pop'
  }
}

export const writeSavedTheme = (theme: ThemeId): void => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Keep the in-memory theme usable when browser storage is unavailable.
  }
}