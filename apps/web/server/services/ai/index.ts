import type { AIService } from './types'
import { HeuristicAIService } from './heuristic'
import { AnthropicAIService } from './anthropic'

let service: AIService | null = null

/**
 * Returns the configured AIService. Falls back to HeuristicAIService when
 * no AI_API_KEY is set — see .env.example. Callers depend only on the
 * AIService interface, so a real LLM provider can replace the heuristic
 * implementation here without any other change.
 */
export function getAIService(): AIService {
  if (service) return service

  // AI_API_KEY (not ANTHROPIC_API_KEY) to match the name already documented
  // in .env.example / docs/ENVIRONMENT.md / docs/AI.md — this app's naming
  // convention for the provider-agnostic toggle, not the SDK's own env var.
  const apiKey = process.env.AI_API_KEY
  if (apiKey) {
    service = new AnthropicAIService(apiKey)
    return service
  }

  service = new HeuristicAIService()
  return service
}
