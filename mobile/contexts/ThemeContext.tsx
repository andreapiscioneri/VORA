import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'

import { darkColors, lightColors, ThemeColors } from '../constants/theme'

export type ThemeMode = 'system' | 'light' | 'dark'
const STORAGE_KEY = 'vora-theme-mode'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  scheme: 'light' | 'dark'
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme())

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved)
      }
    })
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme))
    return () => sub.remove()
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next)
  }

  const scheme: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode

  const colors = useMemo(() => (scheme === 'light' ? lightColors : darkColors), [scheme])

  return <ThemeContext.Provider value={{ mode, setMode, scheme, colors }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
