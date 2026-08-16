import type { SearchResult } from '~/shared/types/search'

export function useGlobalSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0

  async function runSearch(q: string) {
    const id = ++requestId
    if (q.trim().length < 2) {
      results.value = []
      loading.value = false
      return
    }
    loading.value = true
    try {
      const data = await $fetch<SearchResult[]>('/api/search', { query: { q } })
      // Ignore stale responses from an earlier keystroke that resolved late.
      if (id === requestId) results.value = data
    } catch {
      if (id === requestId) results.value = []
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  watch(query, (q) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch(q), 200)
  })

  function reset() {
    query.value = ''
    results.value = []
    loading.value = false
  }

  return { query, results, loading, reset }
}
