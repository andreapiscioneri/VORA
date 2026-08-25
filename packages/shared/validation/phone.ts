// Loose E.164-style check: optional leading "+", 7-15 digits total: enough
// to catch garbage input (letters, obviously-too-short/long strings)
// without a hard dependency on a full country/prefix library — no country
// field exists on Contact today for a library like libphonenumber-js to
// key off of.
const PHONE_RE = /^\+?[1-9]\d{6,14}$/

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/[\s().-]/g, '')
  return PHONE_RE.test(digits)
}
