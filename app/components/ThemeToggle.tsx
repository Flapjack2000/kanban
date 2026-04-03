'use client'

import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <button
      onClick={toggle}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      aria-label="Toggle dark mode"
    >
      {mounted ? (theme === 'dark' ? '☀ Light' : '☾ Dark') : null}
    </button>
  )
}