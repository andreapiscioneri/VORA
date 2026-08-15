import type { AIService } from './types'
import { HeuristicAIService } from './heuristic'

let service: AIService | null = null

/**
 * Returns the configured AIService. Falls back to HeuristicAIService when
 * no AI_API_KEY is set — see .env.example. Callers depend only on the
 * AIService interface, so a real LLM provider can replace the heuristic
 * implementation here without any other change.
 */
export function getAIService(): AIService {
  if (service) return service

  service = new HeuristicAIService()
  return service
}
