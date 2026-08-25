import { resolveSession } from '~/server/utils/auth'

// resolveSession accepts either the web session cookie or a mobile bearer
// access token, so this single endpoint serves both AuthContext.checkSession()
// implementations (web's useUserSession() refresh and mobile's app-launch check).
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  return { user: session?.user ?? null }
})
