'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'gitfort-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    
    const updateTheme = () => {
      let resolved: 'light' | 'dark'
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        resolved = theme
      }
      
      setResolvedTheme(resolved)
      
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      
      root.style.colorScheme = resolved
    }

    updateTheme()

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return '🖥️'
    }
    return resolvedTheme === 'dark' ? '🌙' : '☀️'
  }

  const getLabel = () => {
    if (theme === 'system') {
      return 'System'
    }
    return resolvedTheme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={`Current theme: ${getLabel()}. Click to cycle through themes.`}
    >
      <span className="mr-2">{getIcon()}</span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  )
}

interface ThemeSelectProps {
  className?: string
}

export function ThemeSelect({ className = '' }: ThemeSelectProps) {
  const { theme, setTheme } = useTheme()

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className={`px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    >
      <option value="light">☀️ Light</option>
      <option value="dark">🌙 Dark</option>
      <option value="system">🖥️ System</option>
    </select>
  )
}