import type { Employee, EmployeeInput } from '~/shared/types/employee'

export function useEmployees() {
  const employees = useState<Employee[]>('employees', () => [])
  const pending = useState('employees-pending', () => false)
  const error = useState<string | null>('employees-error', () => null)

  async function fetchEmployees() {
    pending.value = true
    error.value = null
    try {
      employees.value = await $fetch<Employee[]>('/api/employees')
    } catch {
      error.value = 'employees.errors.load'
    } finally {
      pending.value = false
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

  return { employees, pending, error, fetchEmployees, createEmployee, updateEmployee, removeEmployee }
}
