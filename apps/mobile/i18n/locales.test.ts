import { LOCALES, LOCALE_CODES, LOCALE_NAMES } from './index'

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([key, value]) => collectKeys(value, prefix ? `${prefix}.${key}` : key))
}

describe('locale files', () => {
  it('all 8 languages are registered', () => {
    expect(LOCALE_CODES.sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'ja', 'ru', 'zh'])
  })

  it('every locale has a display name', () => {
    for (const code of LOCALE_CODES) {
      expect(LOCALE_NAMES[code]).toEqual(expect.any(String))
      expect(LOCALE_NAMES[code].length).toBeGreaterThan(0)
    }
  })

  const referenceKeys = collectKeys(LOCALES.it).sort()

  it.each(LOCALE_CODES)('%s has exactly the same keys as the it (default) locale', (code) => {
    const keys = collectKeys(LOCALES[code]).sort()
    expect(keys).toEqual(referenceKeys)
  })

  it.each(LOCALE_CODES)('%s has no empty translation values', (code) => {
    const values = Object.values(LOCALES[code]).length ? collectKeys(LOCALES[code]) : []
    function collectValues(obj: unknown): string[] {
      if (typeof obj === 'string') return [obj]
      if (typeof obj !== 'object' || obj === null) return []
      return Object.values(obj).flatMap(collectValues)
    }
    for (const value of collectValues(LOCALES[code])) {
      expect(value.trim().length).toBeGreaterThan(0)
    }
  })
})
