export const SEARCH_RESULT_TYPES = [
  'contact',
  'task',
  'appointment',
  'ticket',
  'project',
  'communication',
  'knowledge',
] as const
export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number]

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  to: string
}
