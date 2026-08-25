import { describe, expect, it } from 'vitest'
import { HeuristicAIService } from '../../../server/services/ai/heuristic'

async function collect(iterable: AsyncIterable<string>): Promise<string> {
  let out = ''
  for await (const chunk of iterable) out += chunk
  return out
}

describe('HeuristicAIService.wellbeingChat', () => {
  const service = new HeuristicAIService()

  it('prioritizes crisis language over everything else', async () => {
    const reply = await collect(service.wellbeingChat([], 'a volte penso di farmi del male'))
    expect(reply).toContain('Telefono Amico')
  })

  it('responds to stress-related language', async () => {
    const reply = await collect(service.wellbeingChat([], 'sono molto stressato ultimamente'))
    expect(reply.length).toBeGreaterThan(0)
    expect(reply).not.toContain('Telefono Amico')
  })

  it('falls back to a generic listening prompt', async () => {
    const reply = await collect(service.wellbeingChat([], 'oggi il tempo è bello'))
    expect(reply.length).toBeGreaterThan(0)
  })

  it('yields exactly once (no real streaming without an LLM)', async () => {
    let count = 0
    for await (const _chunk of service.wellbeingChat([], 'ciao')) count++
    expect(count).toBe(1)
  })
})
