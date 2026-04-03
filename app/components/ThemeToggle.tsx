'use client'

import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

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
      {mounted ? (theme === 'dark' ?
        <Sun className='text-yellow-200 cursor-pointer' /> : <Moon className='text-indigo-600 cursor-pointer' />)
        : null}

    </button>
  )
}