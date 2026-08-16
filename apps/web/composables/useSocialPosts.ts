import type { SocialPost, SocialPostInput } from '~/shared/types/social-post'

export function useSocialPosts() {
  const posts = useState<SocialPost[]>('social-posts', () => [])
  const pending = useState('social-posts-pending', () => false)
  const error = useState<string | null>('social-posts-error', () => null)

  async function fetchPosts() {
    pending.value = true
    error.value = null
    try {
      posts.value = await $fetch<SocialPost[]>('/api/social-posts')
    } catch {
      error.value = 'social.errors.load'
    } finally {
      pending.value = false
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

  return { posts, pending, error, fetchPosts, createPost, updatePost, removePost }
}
