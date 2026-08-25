// Shared between the zod refinement in auth.ts (server-enforced) and any
// strength-meter UI (client-only, informational) — one scoring function so
// the two can never drift apart on what counts as "weak".
export interface PasswordStrength {
  /** 0 (empty) to 4 (long + every character class) — drives a UI meter. */
  score: 0 | 1 | 2 | 3 | 4
  /** Fewer than 3 of {lowercase, uppercase, digit, symbol} — the bar the zod schema enforces. */
  weak: boolean
}

export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, weak: true }

  let classes = 0
  if (/[a-z]/.test(password)) classes++
  if (/[A-Z]/.test(password)) classes++
  if (/[0-9]/.test(password)) classes++
  if (/[^a-zA-Z0-9]/.test(password)) classes++

  const lengthBonus = password.length >= 12 ? 1 : 0
  const score = Math.max(0, Math.min(4, classes - 1 + lengthBonus)) as PasswordStrength['score']

  return { score, weak: classes < 3 }
}
