import type { EmbeddingService } from './types'

const DIMENSIONS = 256

// Small multi-language stopword list (the app supports 8 UI locales, and
// Knowledge content is realistically Italian/English). Filtering these out
// keeps the vector dominated by actual content words instead of "il", "the",
// "di", "and", etc.
const STOPWORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'e', 'o', 'ma', 'che', 'chi', 'cui', 'non', 'si', 'come', 'più', 'anche', 'è', 'sono', 'del', 'della', 'dei',
  'delle', 'al', 'allo', 'alla', 'ai', 'agli', 'alle', 'questo', 'questa', 'questi', 'queste',
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'with', 'as', 'at', 'by', 'from', 'this', 'that', 'these', 'those', 'it', 'its', 'not',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // strip accents so "città" and "citta" hash the same
    .match(/[a-z0-9]+/g)
    ?.filter((w) => w.length > 1 && !STOPWORDS.has(w)) ?? []
}

// djb2 — fast, deterministic, good-enough distribution for a hashing trick.
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

/**
 * Hashing-trick bag-of-words embedding: every token (and word-adjacent
 * bigram, to capture some word order) is hashed into one of `dimensions`
 * buckets and counted, then the vector is L2-normalized so cosine
 * similarity reduces to a dot product. This is NOT a semantic embedding —
 * it has no model behind it and doesn't understand meaning or synonyms, it
 * only measures token/phrase overlap. That's an honest, zero-dependency
 * stand-in for real search relevance and RAG retrieval; swap in a real
 * embedding API (OpenAI, Vertex, Cohere, ...) here later without touching
 * any caller — they only see `embed(text): number[]`.
 */
export class HeuristicEmbeddingService implements EmbeddingService {
  readonly name = 'heuristic'
  readonly dimensions = DIMENSIONS

  embed(text: string): number[] {
    const tokens = tokenize(text)
    const vector = new Array(DIMENSIONS).fill(0)

    for (const token of tokens) {
      vector[hash(token) % DIMENSIONS] += 1
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      vector[hash(`${tokens[i]}_${tokens[i + 1]}`) % DIMENSIONS] += 0.5
    }

    let norm = 0
    for (const v of vector) norm += v * v
    norm = Math.sqrt(norm)
    if (norm === 0) return vector

    return vector.map((v) => v / norm)
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot // vectors are already L2-normalized, so dot product === cosine similarity
}
