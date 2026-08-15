import type { LeaveRequest, LeaveRequestInput, LeaveStatus } from '~/shared/types/leave'

export function useLeaveRequests() {
  const requests = useState<LeaveRequest[]>('leave-requests', () => [])
  const pending = useState('leave-requests-pending', () => false)
  const error = useState<string | null>('leave-requests-error', () => null)

  async function fetchRequests() {
    pending.value = true
    error.value = null
    try {
      requests.value = await $fetch<LeaveRequest[]>('/api/leave-requests')
    } catch {
      error.value = 'leave.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function createRequest(input: LeaveRequestInput) {
    const created = await $fetch<LeaveRequest>('/api/leave-requests', { method: 'POST', body: input })
    requests.value = [created, ...requests.value]
    return created
  }

  async function updateRequest(id: string, input: LeaveRequestInput) {
    const updated = await $fetch<LeaveRequest>(`/api/leave-requests/${id}`, { method: 'PUT', body: input })
    requests.value = requests.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  async function setStatus(request: LeaveRequest, status: LeaveStatus) {
    const { id, createdAt, updatedAt, ...input } = request
    return await updateRequest(id, { ...input, status })
  }

  async function removeRequest(id: string) {
    await $fetch(`/api/leave-requests/${id}`, { method: 'DELETE' })
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  return { requests, pending, error, fetchRequests, createRequest, updateRequest, setStatus, removeRequest }
}
