import { useState } from 'react'
import { House, Palette } from 'lucide-react'
import { THEME_OPTIONS, type ThemeId } from '../theme'

type Props = {
  onHome?: () => void
  onThemeChange: (theme: ThemeId) => void
  theme: ThemeId
}

export const ThemePicker = ({ onHome, onThemeChange, theme }: Props) => {
  const [themesOpen, setThemesOpen] = useState(false)
  const selectedTheme = THEME_OPTIONS.find((option) => option.id === theme)

  return (
    <div className="theme-picker">
      {onHome && (
        <button
          aria-label="Return to setup"
          className="btn theme-home"
          onClick={onHome}
          title="Return to setup"
          type="button"
        >
          <House aria-hidden="true" size={22} strokeWidth={2.25} />
        </button>
      )}
      <button
        aria-controls="theme-picker-options"
        aria-expanded={themesOpen}
        aria-label={`Choose theme, currently ${selectedTheme?.label ?? 'Midnight'}`}
        className="btn theme-trigger"
        onClick={() => setThemesOpen((value) => !value)}
        title="Choose a game theme"
        type="button"
      >
        <Palette aria-hidden="true" size={22} strokeWidth={2.25} />
      </button>

      {themesOpen && (
        <div
          aria-label="Game theme"
          className="theme-popover"
          id="theme-picker-options"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setThemesOpen(false)
          }}
          role="group"
        >
          <div className="theme-grid">
            {THEME_OPTIONS.map((option) => (
              <button
                aria-pressed={theme === option.id}
                className={`theme-option ${theme === option.id ? 'theme-option--on' : ''}`}
                key={option.id}
                onClick={() => {
                  onThemeChange(option.id)
                  setThemesOpen(false)
                }}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`theme-option__swatches theme-option__swatches--${option.id}`}
                >
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-option__copy">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}