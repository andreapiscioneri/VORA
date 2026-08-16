import type { H3Event } from 'h3'
import { getDb } from './firebase'

export interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export const DEFAULT_PAGE_SIZE = 20

export interface PaginationParams {
  cursor: string | null
  pageSize: number
}

/** Parses `?cursor=<id>&pageSize=<n>` off a GET request, following the
 * `getQuery(event)` house style used elsewhere (e.g. server/api/search.get.ts).
 * Falls back to DEFAULT_PAGE_SIZE for a missing/invalid pageSize, and caps it
 * so a client can't force an unbounded scan. */
export function parsePaginationParams(event: H3Event, maxPageSize = 100): PaginationParams {
  const q = getQuery(event)
  const cursorRaw = q.cursor
  const cursor = typeof cursorRaw === 'string' && cursorRaw.trim() ? cursorRaw.trim() : null

  const pageSizeRaw = q.pageSize
  const parsed = typeof pageSizeRaw === 'string' ? Number.parseInt(pageSizeRaw, 10) : NaN
  const pageSize = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maxPageSize) : DEFAULT_PAGE_SIZE

  return { cursor, pageSize }
}

/**
 * Applies cursor-based pagination to a Firestore query that is already
 * filtered by organizationId and ordered (e.g. `.orderBy('createdAt', 'desc')`).
 *
 * `collection` is the name of the collection the query reads from — used to
 * look up the cursor document by id so `.startAfter()` can be applied. Fetches
 * one extra document beyond `pageSize` to detect `hasMore` without a second
 * round trip; `nextCursor` is the last returned item's id, or null when there
 * is no further page.
 */
export async function paginateQuery<T>(
  query: FirebaseFirestore.Query,
  collection: string,
  params: { cursor?: string | null; pageSize?: number } | undefined,
  toEntity: (id: string, data: FirebaseFirestore.DocumentData) => T,
): Promise<PageResult<T>> {
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE

  let pagedQuery = query
  if (params?.cursor) {
    const cursorDoc = await getDb().collection(collection).doc(params.cursor).get()
    if (cursorDoc.exists) {
      pagedQuery = pagedQuery.startAfter(cursorDoc)
    }
  }

  const snapshot = await pagedQuery.limit(pageSize + 1).get()
  const hasMore = snapshot.docs.length > pageSize
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

  return {
    items: docs.map((doc) => toEntity(doc.id, doc.data())),
    nextCursor: hasMore ? docs[docs.length - 1].id : null,
    hasMore,
  }
}
