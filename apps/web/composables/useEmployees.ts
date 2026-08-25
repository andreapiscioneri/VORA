import type { Employee, EmployeeInput } from '~/shared/types/employee'
import type { PageResult } from '~/server/utils/pagination'

export function useEmployees() {
  const employees = useState<Employee[]>('employees', () => [])
  const pending = useState('employees-pending', () => false)
  const loadingMore = useState('employees-loading-more', () => false)
  const error = useState<string | null>('employees-error', () => null)
  const nextCursor = useState<string | null>('employees-cursor', () => null)
  const hasMore = useState('employees-has-more', () => false)

  async function fetchEmployees() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Employee>>('/api/employees')
      employees.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'employees.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Employee>>('/api/employees', { query: { cursor: nextCursor.value } })
      employees.value = [...employees.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createEmployee(input: EmployeeInput) {
    const created = await $fetch<Employee>('/api/employees', { method: 'POST', body: input })
    employees.value = [...employees.value, created].sort((a, b) => a.firstName.localeCompare(b.firstName))
    return created
  }

  async function updateEmployee(id: string, input: EmployeeInput) {
    const updated = await $fetch<Employee>(`/api/employees/${id}`, { method: 'PUT', body: input })
    employees.value = employees.value.map((e) => (e.id === id ? updated : e))
    return updated
  }

  async function removeEmployee(id: string) {
    await $fetch(`/api/employees/${id}`, { method: 'DELETE' })
    employees.value = employees.value.filter((e) => e.id !== id)
  }

  return { employees, pending, error, hasMore, loadingMore, fetchEmployees, loadMore, createEmployee, updateEmployee, removeEmployee }
}
