export type PlayerColor = {
  id: string
  label: string
  value: string
}

/** Mid-tone hues so a player reads clearly on both the light and dark themes. */
export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'blue', label: 'Blue', value: '#2f7fe4' },
  { id: 'pink', label: 'Pink', value: '#e0459a' },
  { id: 'green', label: 'Green', value: '#1c9e5f' },
  { id: 'orange', label: 'Orange', value: '#e0761c' },
  { id: 'purple', label: 'Purple', value: '#8250d8' },
  { id: 'teal', label: 'Teal', value: '#0f97a3' },
]

export const defaultPlayerColor = (index: number): string =>
  PLAYER_COLORS[index % PLAYER_COLORS.length].id

export const playerColorValue = (id: string): string =>
  PLAYER_COLORS.find((color) => color.id === id)?.value ?? PLAYER_COLORS[0].value

export const isPlayerColor = (id: unknown): id is string =>
  typeof id === 'string' && PLAYER_COLORS.some((color) => color.id === id)
