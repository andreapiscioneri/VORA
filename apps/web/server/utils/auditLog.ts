import type { AuditAction, AuditLogEntry } from '~/shared/types/auditLog'
import { getDb } from './firebase'

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
    console.error('[audit] failed to record entry:', error)
  }
}

export async function listAuditLog(organizationId: string, limit = 100): Promise<AuditLogEntry[]> {
  const snap = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snap.docs
    .map((doc) => toEntry(doc.id, doc.data()))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit)
}
