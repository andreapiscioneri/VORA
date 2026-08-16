/**
 * Abstraction over text embedding. The rest of the app calls only this
 * method — never a provider SDK directly — so a real embedding API (OpenAI,
 * Vertex, Cohere, ...) can be plugged in later (see index.ts) without
 * touching callers or the stored vector shape (a plain number[]).
 */
export interface EmbeddingService {
  readonly name: string
  readonly dimensions: number
  embed(text: string): number[]
}
