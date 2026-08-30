import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Contact, ContactInput } from '@vora/shared/types/contact'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'contacts'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
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
      const page = await api.get<PageResult<Contact>>('/contacts')
      setContacts(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      const cached = await readCache<Contact[]>(CACHE_KEY)
      if (cached) {
        setContacts(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load contacts')
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
      const page = await api.get<PageResult<Contact>>(`/contacts?cursor=${encodeURIComponent(nextCursor)}`)
      setContacts((prev) => {
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

  const create = useCallback(async (input: ContactInput) => {
    const created = await api.post<Contact>('/contacts', input)
    setContacts((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  return { contacts, loading, loadingMore, error, offline, hasMore, reload: load, loadMore, create }
}
