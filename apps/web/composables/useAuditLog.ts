import type { AuditLogEntry } from '~/shared/types/auditLog'
import type { PageResult } from '~/server/utils/pagination'

export function useAuditLog() {
  const entries = useState<AuditLogEntry[]>('audit-log', () => [])
  const pending = useState('audit-log-pending', () => false)
  const loadingMore = useState('audit-log-loading-more', () => false)
  const error = useState<string | null>('audit-log-error', () => null)
  const nextCursor = useState<string | null>('audit-log-cursor', () => null)
  const hasMore = useState('audit-log-has-more', () => false)

  async function fetchEntries() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<AuditLogEntry>>('/api/audit-log')
      entries.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch (e) {
      const err = e as { statusCode?: number }
      error.value = err.statusCode === 403 ? 'auditLog.errors.forbidden' : 'auditLog.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<AuditLogEntry>>('/api/audit-log', { query: { cursor: nextCursor.value } })
      entries.value = [...entries.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  return { entries, pending, error, hasMore, loadingMore, fetchEntries, loadMore }
}
