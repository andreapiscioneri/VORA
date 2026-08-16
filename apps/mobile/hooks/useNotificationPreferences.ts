import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { NotificationPreferences } from '@vora/shared/types/notification'

const DEFAULTS: NotificationPreferences = {
  messages: true,
  urgentTasks: true,
  appointments: true,
  reminders: true,
  aiActions: true,
  approvals: true,
  tickets: true,
  deadlines: true,
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPreferences(await api.get<NotificationPreferences>('/notifications/preferences'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = useCallback(
    async (key: keyof NotificationPreferences) => {
      const next = { ...preferences, [key]: !preferences[key] }
      setPreferences(next)
      setSaving(true)
      try {
        await api.put<NotificationPreferences>('/notifications/preferences', next)
      } finally {
        setSaving(false)
      }
    },
    [preferences]
  )

  return { preferences, loading, saving, error, toggle }
}
