import { getRequestHeader, getRequestHost, type H3Event } from 'h3'

export const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// CSRF defense for the cookie-authenticated (web) session only: the session
// cookie is SameSite=Lax (nuxt-auth-utils' default — see docs/AUTH.md),
// which blocks cross-site fetch/XHR but NOT a cross-site top-level
// `<form method="POST">` submission, which still carries the cookie under
// Lax. Browsers attach a real Origin header to exactly that kind of
// cross-site form POST (it was added to the platform specifically to make
// this check possible), so rejecting a mismatched Origin/Referer closes
// the gap without touching SameSite — which can't be tightened to Strict
// here without risking the Google OAuth callback's cross-site redirect
// into an authenticated GET (server/api/auth/google.get.ts).
// Requests with no Origin/Referer at all (mobile's own fetch, non-browser
// tooling, tests) are let through here — they're not the attack this
// guards against, and the mobile Bearer-token path is never vulnerable to
// CSRF in the first place, since no attacker page can attach a bearer
// token cross-origin.
export function hasValidOrigin(event: H3Event): boolean {
  const candidate = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer')
  if (!candidate) return true
  try {
    return new URL(candidate).host === getRequestHost(event)
  } catch {
    return false
  }
}
