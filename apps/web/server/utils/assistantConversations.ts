import type { AssistantConversation, AssistantConversationSummary, AssistantMessage } from '~/shared/types/assistant'
import { getDb } from './firebase'

const COLLECTION = 'aiConversations'
const MAX_TITLE_PREVIEW = 60

function toConversation(id: string, data: FirebaseFirestore.DocumentData): AssistantConversation {
  return {
    id,
    title: data.title ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    archivedAt: data.archivedAt ?? null,
    messages: data.messages ?? [],
  }
}

function toSummary(conversation: AssistantConversation): AssistantConversationSummary {
  const lastMessage = conversation.messages[conversation.messages.length - 1]
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    archivedAt: conversation.archivedAt,
    messageCount: conversation.messages.length,
    preview: lastMessage ? lastMessage.content.slice(0, MAX_TITLE_PREVIEW) : '',
  }
}

// Personal, not org-shared: every conversation belongs to exactly one user
// within the org (organizationId still stored for multi-tenant hygiene and
// so a deleted/offboarded org can be purged in bulk like every other
// collection), so every read/write below checks both fields — not just
// organizationId — before touching a document.
export async function createConversation(organizationId: string, userId: string, title: string): Promise<AssistantConversation> {
  const now = new Date().toISOString()
  const data = { organizationId, userId, title, createdAt: now, updatedAt: now, archivedAt: null, messages: [] as AssistantMessage[] }
  const ref = await getDb().collection(COLLECTION).add(data)
  return toConversation(ref.id, data)
}

export async function listConversations(
  organizationId: string,
  userId: string,
  params?: { archived?: boolean; query?: string },
): Promise<AssistantConversationSummary[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).where('userId', '==', userId).get()

  let conversations = snapshot.docs.map((doc) => toConversation(doc.id, doc.data()))
  conversations = conversations.filter((c) => (params?.archived ? c.archivedAt !== null : c.archivedAt === null))

  const query = params?.query?.trim().toLowerCase()
  if (query) {
    conversations = conversations.filter(
      (c) => c.title.toLowerCase().includes(query) || c.messages.some((m) => m.content.toLowerCase().includes(query)),
    )
  }

  return conversations.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0)).map(toSummary)
}

export async function getConversation(id: string, organizationId: string, userId: string): Promise<AssistantConversation | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  const data = doc.data()
  if (!doc.exists || data?.organizationId !== organizationId || data?.userId !== userId) return null
  return toConversation(doc.id, data!)
}

export async function appendMessages(
  id: string,
  organizationId: string,
  userId: string,
  newMessages: AssistantMessage[],
  opts?: { title?: string },
): Promise<AssistantConversation | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  const data = existing.data()
  if (!existing.exists || data?.organizationId !== organizationId || data?.userId !== userId) return null

  const messages = [...(data?.messages ?? []), ...newMessages]
  const updatedAt = new Date().toISOString()
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = { messages, updatedAt }
  if (opts?.title) update.title = opts.title

  await ref.update(update)
  return toConversation(id, { ...data, ...update })
}

// Replaces one existing message in place (used to attach a tool result, or
// to flip a pending-confirmation tool call to executed/rejected) rather
// than appending — the message already exists, only part of it changes.
export async function replaceMessage(
  id: string,
  organizationId: string,
  userId: string,
  updatedMessage: AssistantMessage,
): Promise<AssistantConversation | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  const data = existing.data()
  if (!existing.exists || data?.organizationId !== organizationId || data?.userId !== userId) return null

  const messages: AssistantMessage[] = (data?.messages ?? []).map((m: AssistantMessage) => (m.id === updatedMessage.id ? updatedMessage : m))
  const updatedAt = new Date().toISOString()
  await ref.update({ messages, updatedAt })
  return toConversation(id, { ...data, messages, updatedAt })
}

export async function renameConversation(id: string, organizationId: string, userId: string, title: string): Promise<AssistantConversation | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  const data = existing.data()
  if (!existing.exists || data?.organizationId !== organizationId || data?.userId !== userId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ title, updatedAt })
  return toConversation(id, { ...data, title, updatedAt })
}

export async function setConversationArchived(
  id: string,
  organizationId: string,
  userId: string,
  archived: boolean,
): Promise<AssistantConversation | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  const data = existing.data()
  if (!existing.exists || data?.organizationId !== organizationId || data?.userId !== userId) return null

  const archivedAt = archived ? new Date().toISOString() : null
  const updatedAt = new Date().toISOString()
  await ref.update({ archivedAt, updatedAt })
  return toConversation(id, { ...data, archivedAt, updatedAt })
}

export async function deleteConversation(id: string, organizationId: string, userId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  const data = existing.data()
  if (!existing.exists || data?.organizationId !== organizationId || data?.userId !== userId) return false
  await ref.delete()
  return true
}
