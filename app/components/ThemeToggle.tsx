'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
    </button>
  )
}