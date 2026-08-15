import { listPosts } from '~/server/utils/social-posts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listPosts(await requireOrgId(event))
})
