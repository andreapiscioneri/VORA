import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { KnowledgeDocument, KnowledgeDocumentInput } from '@vora/shared/types/knowledge'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'knowledge'

export function useKnowledge() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<KnowledgeDocument>>('/knowledge')
      setDocuments(page.items)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      const cached = await readCache<KnowledgeDocument[]>(CACHE_KEY)
      if (cached) {
        setDocuments(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load knowledge documents')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(async (input: KnowledgeDocumentInput) => {
    const created = await api.post<KnowledgeDocument>('/knowledge', input)
    setDocuments((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  const update = useCallback(async (id: string, input: KnowledgeDocumentInput) => {
    const updated = await api.put<KnowledgeDocument>(`/knowledge/${id}`, input)
    setDocuments((prev) => {
      const next = prev.map((d) => (d.id === id ? updated : d))
      writeCache(CACHE_KEY, next)
      return next
    })
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/knowledge/${id}`)
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id)
      writeCache(CACHE_KEY, next)
      return next
    })
  }, [])

  return { documents, loading, error, offline, reload: load, create, update, remove }
}
