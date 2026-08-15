import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Contact } from '@vora/shared/types/contact'

const CACHE_KEY = 'contacts'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Contact[]>('/contacts')
      setContacts(data)
      setOffline(false)
      writeCache(CACHE_KEY, data)
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

  return { contacts, loading, error, offline, reload: load }
}
