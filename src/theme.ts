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