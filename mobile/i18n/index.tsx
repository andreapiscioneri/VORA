import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import ja from './locales/ja.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

export const LOCALES = { it, en, de, es, fr, ru, zh, ja } as const
export type Locale = keyof typeof LOCALES
export const LOCALE_CODES = Object.keys(LOCALES) as Locale[]

export const LOCALE_NAMES: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
}

const DEFAULT_LOCALE: Locale = 'it'
const STORAGE_KEY = 'vora-locale'

type Dict = typeof it
type Vars = Record<string, string | number>

function getNested(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), dict)
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

function detectDeviceLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageCode
  return (LOCALE_CODES as string[]).includes(tag ?? '') ? (tag as Locale) : DEFAULT_LOCALE
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (LOCALE_CODES as string[]).includes(saved)) {
        setLocaleState(saved as Locale)
      } else {
        setLocaleState(detectDeviceLocale())
      }
    })
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    AsyncStorage.setItem(STORAGE_KEY, next)
  }

  const t = useMemo(() => {
    return (key: string, vars?: Vars) => {
      const dict = LOCALES[locale]
      const value = getNested(dict, key) ?? getNested(LOCALES[DEFAULT_LOCALE], key)
      return typeof value === 'string' ? interpolate(value, vars) : key
    }
  }, [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
