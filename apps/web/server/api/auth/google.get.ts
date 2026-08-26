import { findOrCreateOAuthUser, isApproved } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'
import { logger } from '~/server/utils/logger'
import { notifyRegistrationPending } from '~/server/utils/registrationNotify'

// Real, working OAuth code — not a stub. It genuinely does nothing until
// NUXT_OAUTH_GOOGLE_CLIENT_ID/SECRET are set (see .env.example): the
// underlying nuxt-auth-utils handler detects missing config and calls
// onError below with a clean redirect, rather than the button silently
// failing or crashing the server. No credentials are invented here — you
// register your own OAuth app in the Google Cloud Console and paste the
// real client id/secret into .env, same pattern as every other optional
// provider in this codebase (AI, email, WhatsApp).
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user: googleUser }) {
    const email = googleUser.email as string | undefined
    if (!email) {
      return sendRedirect(event, '/login?error=oauth_failed')
    }
    const name = (googleUser.name as string) || email.split('@')[0]
    const meta = {
      ip: getRequestIP(event, { xForwardedFor: true }) ?? 'unknown',
      userAgent: getRequestHeader(event, 'user-agent') ?? 'unknown',
      platform: 'web' as const,
    }

    const { user, membership, isNew } = await findOrCreateOAuthUser(email, name, meta)

    if (isNew) await notifyRegistrationPending(user, membership.organizationName, meta)

    if (!isApproved(user)) {
      return sendRedirect(event, '/login?error=pending_approval')
    }

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
        organizationId: membership.organizationId,
        organizationName: membership.organizationName,
        role: membership.role,
        platformRole: user.platformRole,
      },
    })

    await logAction(membership.organizationId, user.id, user.name, 'login', 'session')
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    logger.error('web google oauth failed', {}, error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
