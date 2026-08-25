import type { WellbeingChatMessage } from '~/shared/types/wellbeing'
import { getDb } from './firebase'

const COLLECTION = 'wellbeingChatMessages'
const HISTORY_LIMIT = 50

function toMessage(id: string, data: FirebaseFirestore.DocumentData): WellbeingChatMessage {
  return {
    id,
    userId: data.userId ?? '',
    role: data.role === 'assistant' ? 'assistant' : 'user',
    content: data.content ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

// Same personal-not-shared scoping as wellbeingCheckIns (server/utils/wellbeing.ts):
// organizationId for tenant isolation, userId so colleagues can't read each
// other's conversation. Ordered oldest-first (conversation reading order),
// capped to the most recent HISTORY_LIMIT so a long-running conversation
// doesn't grow the Claude request unbounded.
export async function listMessages(organizationId: string, userId: string): Promise<WellbeingChatMessage[]> {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where('organizationId', '==', organizationId)
    .where('userId', '==', userId)
    .get()
  return snapshot.docs
    .map((doc) => toMessage(doc.id, doc.data()))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
    .slice(-HISTORY_LIMIT)
}

export async function appendMessage(
  organizationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<WellbeingChatMessage> {
  const now = new Date().toISOString()
  const ref = await getDb().collection(COLLECTION).add({ organizationId, userId, role, content, createdAt: now })
  return toMessage(ref.id, { userId, role, content, createdAt: now })
}
