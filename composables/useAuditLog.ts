import type { AuditLogEntry } from '~/shared/types/auditLog'

export function useAuditLog() {
  const entries = useState<AuditLogEntry[]>('audit-log', () => [])
  const pending = useState('audit-log-pending', () => false)
  const error = useState<string | null>('audit-log-error', () => null)

  async function fetchEntries() {
    pending.value = true
    error.value = null
    try {
      entries.value = await $fetch<AuditLogEntry[]>('/api/audit-log')
    } catch (e: any) {
      error.value = e?.statusCode === 403 ? 'auditLog.errors.forbidden' : 'auditLog.errors.load'
    } finally {
      pending.value = false
    }
  }

  return { entries, pending, error, fetchEntries }
}
