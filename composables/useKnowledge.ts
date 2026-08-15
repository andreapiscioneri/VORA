import type { KnowledgeDocument, KnowledgeDocumentInput, KnowledgeSearchResult } from '~/shared/types/knowledge'

export function useKnowledge() {
  const documents = useState<KnowledgeDocument[]>('knowledge', () => [])
  const pending = useState('knowledge-pending', () => false)
  const error = useState<string | null>('knowledge-error', () => null)

  async function fetchDocuments() {
    pending.value = true
    error.value = null
    try {
      documents.value = await $fetch<KnowledgeDocument[]>('/api/knowledge')
    } catch {
      error.value = 'knowledge.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function createDocument(input: KnowledgeDocumentInput) {
    const created = await $fetch<KnowledgeDocument>('/api/knowledge', { method: 'POST', body: input })
    documents.value = [created, ...documents.value]
    return created
  }

  async function updateDocument(id: string, input: KnowledgeDocumentInput) {
    const updated = await $fetch<KnowledgeDocument>(`/api/knowledge/${id}`, { method: 'PUT', body: input })
    documents.value = documents.value.map((d) => (d.id === id ? updated : d))
    return updated
  }

  async function toggleFavorite(doc: KnowledgeDocument) {
    const { id, createdAt, updatedAt, ...input } = doc
    return await updateDocument(id, { ...input, favorite: !input.favorite })
  }

  async function removeDocument(id: string) {
    // Widened to `string` on purpose: Nuxt's typed-routes inference narrows
    // the allowed method for this template literal to GET once a sibling
    // static route (search.get.ts) exists under the same prefix — a known
    // limitation, not a real constraint of the actual DELETE endpoint.
    const url: string = `/api/knowledge/${id}`
    await $fetch(url, { method: 'DELETE' })
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  async function searchDocuments(query: string) {
    if (!query.trim()) return []
    return await $fetch<KnowledgeSearchResult[]>('/api/knowledge/search', { query: { q: query } })
  }

  return { documents, pending, error, fetchDocuments, createDocument, updateDocument, toggleFavorite, removeDocument, searchDocuments }
}
