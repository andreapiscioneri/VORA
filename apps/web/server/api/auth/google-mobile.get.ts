import { findOrCreateOAuthUser, isApproved } from '~/server/utils/auth'
import { createAuthToken } from '~/server/utils/authTokens'
import { logAction } from '~/server/utils/auditLog'
import { logger } from '~/server/utils/logger'
import { notifyRegistrationPending } from '~/server/utils/registrationNotify'

const EXCHANGE_CODE_TTL_MS = 5 * 60 * 1000
const MOBILE_REDIRECT_SCHEME = 'vora://oauth-callback'

// A separate route (not a `?mobile=1` flag on google.get.ts) because
// nuxt-auth-utils derives the OAuth redirect_uri from the request's own
// path with no query string (see getOAuthRedirectURL in its source) and
// stores `state` as an opaque random cookie value with no room for custom
// data — there's nowhere in that round-trip to carry a "this is the mobile
// flow" flag through to onSuccess. A dedicated callback path sidesteps
// that entirely; it needs its own entry in the Google Cloud Console's
// authorized redirect URIs (see docs/AUTH.md).
//
// Why this can't just set a cookie and redirect like the web flow does:
// the final redirect leaving this handler is followed by
// expo-web-browser's WebBrowser.openAuthSessionAsync, which runs the whole
// exchange in a system browser context (ASWebAuthenticationSession /
// Chrome Custom Tabs) — a separate cookie jar from the RN app's own
// `fetch`. Any Set-Cookie here lands in the browser's jar, not the app's,
// so the app would never see a session. Instead: mint a short-lived,
// single-use exchange code and hand it to the app via the vora:// deep
// link's query string, then the app trades it for a real session cookie
// itself via POST /api/auth/mobile/google-exchange (server/api/auth/mobile/google-exchange.post.ts),
// through its own `fetch` (credentials: 'include') — same mechanism
// /api/auth/login already uses successfully on mobile.
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user: googleUser }) {
    const email = googleUser.email as string | undefined
    if (!email) {
      return sendRedirect(event, `${MOBILE_REDIRECT_SCHEME}?error=oauth_failed`)
    }
    const name = (googleUser.name as string) || email.split('@')[0]
    const meta = {
      ip: getRequestIP(event, { xForwardedFor: true }) ?? 'unknown',
      userAgent: getRequestHeader(event, 'user-agent') ?? 'unknown',
      platform: 'mobile' as const,
    }

    const { user, membership, isNew } = await findOrCreateOAuthUser(email, name, meta)

    if (isNew) await notifyRegistrationPending(user, membership.organizationName, meta)

    if (!isApproved(user)) {
      return sendRedirect(event, `${MOBILE_REDIRECT_SCHEME}?error=pending_approval`)
    }

    const code = await createAuthToken(user.id, 'mobile-oauth-exchange', EXCHANGE_CODE_TTL_MS)

    await logAction(membership.organizationId, user.id, user.name, 'login', 'session')
    return sendRedirect(event, `${MOBILE_REDIRECT_SCHEME}?code=${code}`)
  },
  onError(event, error) {
    logger.error('mobile google oauth failed', {}, error)
    return sendRedirect(event, `${MOBILE_REDIRECT_SCHEME}?error=oauth_failed`)
  },
})
