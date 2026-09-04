import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { SearchResult } from '@vora/shared/types/search'

// Matches the backend's own floor (server/api/search.get.ts returns [] under
// 2 chars) — no point firing a request that will always come back empty.
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const runSearch = useCallback(async (q: string) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const items = await api.get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`)
      if (requestId === requestIdRef.current) setResults(items)
    } catch (e) {
      if (requestId === requestIdRef.current) setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestIdRef.current++
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  return { query, setQuery, results, loading, error, minLength: MIN_QUERY_LENGTH }
}
