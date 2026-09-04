import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Project, ProjectInput } from '@vora/shared/types/project'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Project>>('/projects')
      setProjects(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
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
      const page = await api.get<PageResult<Project>>(`/projects?cursor=${encodeURIComponent(nextCursor)}`)
      setProjects((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: ProjectInput) => {
    const created = await api.post<Project>('/projects', input)
    setProjects((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: ProjectInput) => {
    const updated = await api.put<Project>(`/projects/${id}`, input)
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/projects/${id}`)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { projects, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
