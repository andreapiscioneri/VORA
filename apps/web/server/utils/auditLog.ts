import type { AuditAction, AuditLogEntry } from '~/shared/types/auditLog'
import { getDb } from './firebase'
import { logger } from './logger'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'auditLogs'

function toEntry(id: string, data: FirebaseFirestore.DocumentData): AuditLogEntry {
  return {
    id,
    userId: data.userId ?? '',
    userName: data.userName ?? '',
    action: data.action ?? 'login',
    entityType: data.entityType ?? '',
    entityId: data.entityId ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

// Fire-and-forget from the caller's perspective — logging a sensitive
// action must never fail the action itself, so this never throws.
export async function logAction(
  organizationId: string,
  userId: string,
  userName: string,
  action: AuditAction,
  entityType: string,
  entityId: string | null = null
): Promise<void> {
  try {
    await getDb()
      .collection(COLLECTION)
      .add({ organizationId, userId, userName, action, entityType, entityId, createdAt: new Date().toISOString() })
  } catch (error) {
    logger.error('audit log entry failed', { organizationId, userId, action, entityType, entityId }, error)
  }
}

export async function listAuditLog(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<AuditLogEntry>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toEntry)
}
