import type { SocialPost, SocialPostInput } from '~/shared/types/social-post'
import type { PageResult } from '~/server/utils/pagination'

export function useSocialPosts() {
  const posts = useState<SocialPost[]>('social-posts', () => [])
  const pending = useState('social-posts-pending', () => false)
  const loadingMore = useState('social-posts-loading-more', () => false)
  const error = useState<string | null>('social-posts-error', () => null)
  const nextCursor = useState<string | null>('social-posts-cursor', () => null)
  const hasMore = useState('social-posts-has-more', () => false)

  async function fetchPosts() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<SocialPost>>('/api/social-posts')
      posts.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'social.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<SocialPost>>('/api/social-posts', { query: { cursor: nextCursor.value } })
      posts.value = [...posts.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createPost(input: SocialPostInput) {
    const created = await $fetch<SocialPost>('/api/social-posts', { method: 'POST', body: input })
    posts.value = [created, ...posts.value]
    return created
  }

  async function updatePost(id: string, input: SocialPostInput) {
    const updated = await $fetch<SocialPost>(`/api/social-posts/${id}`, { method: 'PUT', body: input })
    posts.value = posts.value.map((p) => (p.id === id ? updated : p))
    return updated
  }

  async function removePost(id: string) {
    await $fetch(`/api/social-posts/${id}`, { method: 'DELETE' })
    posts.value = posts.value.filter((p) => p.id !== id)
  }

  return { posts, pending, error, hasMore, loadingMore, fetchPosts, loadMore, createPost, updatePost, removePost }
}
