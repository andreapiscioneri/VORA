export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  folder: string
  tags: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export type KnowledgeDocumentInput = Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>

export interface KnowledgeSearchResult {
  document: KnowledgeDocument
  score: number
}
