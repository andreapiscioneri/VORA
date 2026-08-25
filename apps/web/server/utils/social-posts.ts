import type { SocialPost } from '~/shared/types/social-post'
import type { SocialPostInputSchema } from '~/shared/validation/social-post'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'socialPosts'

function toPost(id: string, data: FirebaseFirestore.DocumentData): SocialPost {
  return {
    id,
    content: data.content ?? '',
    platform: data.platform ?? 'instagram',
    status: data.status ?? 'draft',
    scheduledAt: data.scheduledAt ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listPosts(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<SocialPost>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toPost)
}

export async function createPost(input: SocialPostInputSchema, organizationId: string): Promise<SocialPost> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toPost(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updatePost(id: string, input: SocialPostInputSchema, organizationId: string): Promise<SocialPost | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toPost(id, { ...existing.data(), ...input, updatedAt })
}

export async function deletePost(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
