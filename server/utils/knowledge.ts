import type { KnowledgeDocument } from '~/shared/types/knowledge'
import type { KnowledgeDocumentInputSchema } from '~/shared/validation/knowledge'
import { getDb } from './firebase'
import { getEmbeddingService, cosineSimilarity } from '~/server/services/embeddings'

const COLLECTION = 'knowledge'

function embeddingText(input: { title: string; content: string; tags?: string[] }): string {
  return [input.title, input.content, ...(input.tags ?? [])].join(' ')
}

function toDocument(id: string, data: FirebaseFirestore.DocumentData): KnowledgeDocument {
  return {
    id,
    title: data.title ?? '',
    content: data.content ?? '',
    folder: data.folder ?? '',
    tags: data.tags ?? [],
    favorite: data.favorite ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listDocuments(organizationId: string): Promise<KnowledgeDocument[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toDocument(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getDocument(id: string, organizationId: string): Promise<KnowledgeDocument | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toDocument(doc.id, doc.data()!)
}

export async function createDocument(input: KnowledgeDocumentInputSchema, organizationId: string): Promise<KnowledgeDocument> {
  const now = new Date().toISOString()
  const embedding = getEmbeddingService().embed(embeddingText(input))
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, embedding, createdAt: now, updatedAt: now })
  return toDocument(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateDocument(id: string, input: KnowledgeDocumentInputSchema, organizationId: string): Promise<KnowledgeDocument | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  const embedding = getEmbeddingService().embed(embeddingText(input))
  await ref.update({ ...input, embedding, updatedAt })
  return toDocument(id, { ...existing.data(), ...input, updatedAt })
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocument
  score: number
}

// Ranks every document in the org by cosine similarity between its stored
// embedding and the query's embedding. Documents created before this field
// existed (embedding undefined) score 0 and simply sort last rather than
// erroring — a real backfill isn't needed for a heuristic, zero-dependency
// search that recomputes cheaply on every write anyway.
export async function searchDocuments(organizationId: string, query: string, limit = 10): Promise<KnowledgeSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const embeddingService = getEmbeddingService()
  const queryVector = embeddingService.embed(trimmed)

  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  const scored = snapshot.docs.map((doc) => {
    const data = doc.data()
    const docVector: number[] | undefined = data.embedding
    const score = docVector ? cosineSimilarity(queryVector, docVector) : 0
    return { document: toDocument(doc.id, data), score }
  })

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function deleteDocument(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
