import { describe, expect, it } from 'vitest'
import { HeuristicEmbeddingService, cosineSimilarity } from '../../../server/services/embeddings/heuristic'

const service = new HeuristicEmbeddingService()

describe('HeuristicEmbeddingService', () => {
  it('produces a unit-length (L2-normalized) vector for non-empty text', () => {
    const vector = service.embed('richiedere ferie al responsabile')
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    expect(norm).toBeCloseTo(1, 5)
    expect(vector).toHaveLength(service.dimensions)
  })

  it('returns an all-zero vector for text with only stopwords/punctuation', () => {
    const vector = service.embed('the a of . , !')
    expect(vector.every((v) => v === 0)).toBe(true)
  })

  it('is deterministic — same text always hashes to the same vector', () => {
    expect(service.embed('come richiedere ferie')).toEqual(service.embed('come richiedere ferie'))
  })

  it('is case- and accent-insensitive', () => {
    expect(service.embed('città')).toEqual(service.embed('CITTA'))
  })
})

describe('cosineSimilarity', () => {
  it('scores near-duplicate text highly, near 1', () => {
    const a = service.embed('richiedere ferie al responsabile per approvazione')
    const b = service.embed('per richiedere ferie invia la richiesta al responsabile')
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5)
    expect(cosineSimilarity(a, b)).toBeGreaterThan(0.3)
  })

  it('scores unrelated text low', () => {
    const leave = service.embed('richiedere ferie al responsabile per approvazione')
    const dev = service.embed('configurare ambiente di sviluppo con node e yarn')
    expect(cosineSimilarity(leave, dev)).toBeLessThan(0.1)
  })

  it('ranks a matching document above a non-matching one for a given query', () => {
    const query = service.embed('richiesta approvazione responsabile')
    const leaveDoc = service.embed('Come richiedere ferie. Per richiedere ferie, apri il modulo Ferie, seleziona le date e invia la richiesta al tuo responsabile per approvazione.')
    const devDoc = service.embed('Configurazione ambiente di sviluppo. Per configurare l ambiente locale installa Node, clona il repository e avvia il server con yarn dev.')
    expect(cosineSimilarity(query, leaveDoc)).toBeGreaterThan(cosineSimilarity(query, devDoc))
  })
})
