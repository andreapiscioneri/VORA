import { z } from 'zod'
import { getDb } from '~/server/utils/firebase'
import { resolveSession } from '~/server/utils/auth'

const schema = z.object({ name: z.string().trim().min(1, 'validation.required').max(160) })

// Direct Firestore write rather than going through server/utils/auth.ts —
// this is the only place the `users` collection's `name` field is updated
// outside of registration, and it's simple enough not to need a shared helper.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  await getDb().collection('users').doc(user.id).update({ name: result.data.name })

  // Same-session instant effect, same pattern as email verification: the
  // sealed session cookie carries a name snapshot, so update it directly
  // rather than requiring a re-login to see the change reflected.
  await setUserSession(event, { user: { ...user, name: result.data.name } })

  return { name: result.data.name }
})
