import type { EmbeddingService } from './types'
import { HeuristicEmbeddingService } from './heuristic'

let service: EmbeddingService | null = null

/**
 * Returns the configured EmbeddingService. Currently always the heuristic
 * hashing-trick implementation — no real embedding API is configured (see
 * .env.example). Callers depend only on the EmbeddingService interface, so
 * a real provider can replace it here without any other change.
 */
export function getEmbeddingService(): EmbeddingService {
  if (service) return service

  service = new HeuristicEmbeddingService()
  return service
}

export { cosineSimilarity } from './heuristic'
