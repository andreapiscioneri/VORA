import type { LeaveRequest, LeaveRequestInput, LeaveStatus } from '~/shared/types/leave'
import type { PageResult } from '~/server/utils/pagination'

export function useLeaveRequests() {
  const requests = useState<LeaveRequest[]>('leave-requests', () => [])
  const pending = useState('leave-requests-pending', () => false)
  const loadingMore = useState('leave-requests-loading-more', () => false)
  const error = useState<string | null>('leave-requests-error', () => null)
  const nextCursor = useState<string | null>('leave-requests-cursor', () => null)
  const hasMore = useState('leave-requests-has-more', () => false)
  // Separate from the paginated `requests` list above: the annual balance
  // widget needs every request for the year to sum used days correctly,
  // which the first page alone can't provide once an org has more than one
  // page of history — see server/api/leave-requests/all.get.ts.
  const allRequests = useState<LeaveRequest[]>('leave-requests-all', () => [])

  async function fetchAllRequests() {
    allRequests.value = await $fetch<LeaveRequest[]>('/api/leave-requests/all')
  }

  async function fetchRequests() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<LeaveRequest>>('/api/leave-requests')
      requests.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'leave.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<LeaveRequest>>('/api/leave-requests', { query: { cursor: nextCursor.value } })
      requests.value = [...requests.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createRequest(input: LeaveRequestInput) {
    const created = await $fetch<LeaveRequest>('/api/leave-requests', { method: 'POST', body: input })
    requests.value = [created, ...requests.value]
    allRequests.value = [created, ...allRequests.value]
    return created
  }

  async function updateRequest(id: string, input: LeaveRequestInput) {
    const updated = await $fetch<LeaveRequest>(`/api/leave-requests/${id}`, { method: 'PUT', body: input })
    requests.value = requests.value.map((r) => (r.id === id ? updated : r))
    allRequests.value = allRequests.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  async function setStatus(request: LeaveRequest, status: LeaveStatus) {
    const { id, createdAt, updatedAt, ...input } = request
    return await updateRequest(id, { ...input, status })
  }

  async function removeRequest(id: string) {
    await $fetch(`/api/leave-requests/${id}`, { method: 'DELETE' })
    requests.value = requests.value.filter((r) => r.id !== id)
    allRequests.value = allRequests.value.filter((r) => r.id !== id)
  }

  return { requests, allRequests, pending, error, hasMore, loadingMore, fetchRequests, fetchAllRequests, loadMore, createRequest, updateRequest, setStatus, removeRequest }
}
