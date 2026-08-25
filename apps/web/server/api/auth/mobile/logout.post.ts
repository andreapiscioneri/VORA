import { revokeRefreshToken } from '~/server/utils/mobileTokens'
import { logAction } from '~/server/utils/auditLog'
import { resolveSession } from '~/server/utils/auth'

// Access tokens are stateless (server/utils/mobileTokens.ts) so this can't
// "revoke" the one the client is currently holding — it simply expires
// within ACCESS_TOKEN_TTL_MS regardless. What this does do is revoke the
// refresh token, so no *new* access token can be minted after logout —
// the practical end of the session from the app's perspective, since the
// app discards both tokens from SecureStore immediately after calling this.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (session) {
    await logAction(session.user.organizationId, session.user.id, session.user.name, 'logout', 'session')
  }

  const body = await readBody(event).catch(() => null)
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null
  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }

  return { success: true }
})
