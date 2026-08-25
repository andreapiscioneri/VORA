import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { SocialPost, SocialPostInput } from '@vora/shared/types/social-post'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'social-posts'

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<SocialPost>>('/social-posts')
      setPosts(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      const cached = await readCache<SocialPost[]>(CACHE_KEY)
      if (cached) {
        setPosts(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load social posts')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<SocialPost>>(`/social-posts?cursor=${encodeURIComponent(nextCursor)}`)
      setPosts((prev) => {
        const next = [...prev, ...page.items]
        writeCache(CACHE_KEY, next)
        return next
      })
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: SocialPostInput) => {
    const created = await api.post<SocialPost>('/social-posts', input)
    setPosts((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  const update = useCallback(async (id: string, input: SocialPostInput) => {
    const updated = await api.put<SocialPost>(`/social-posts/${id}`, input)
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === id ? updated : p))
      writeCache(CACHE_KEY, next)
      return next
    })
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/social-posts/${id}`)
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      writeCache(CACHE_KEY, next)
      return next
    })
  }, [])

  return { posts, loading, loadingMore, error, offline, hasMore, reload: load, loadMore, create, update, remove }
}
