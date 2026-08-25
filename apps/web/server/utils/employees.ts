import type { Employee } from '~/shared/types/employee'
import type { EmployeeInputSchema } from '~/shared/validation/employee'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'employees'

function toEmployee(id: string, data: FirebaseFirestore.DocumentData): Employee {
  return {
    id,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    email: data.email ?? '',
    role: data.role ?? '',
    team: data.team ?? '',
    status: data.status ?? 'active',
    startDate: data.startDate ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listEmployees(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Employee>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toEmployee)
}

export async function getEmployee(id: string, organizationId: string): Promise<Employee | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toEmployee(doc.id, doc.data()!)
}

export async function createEmployee(input: EmployeeInputSchema, organizationId: string): Promise<Employee> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toEmployee(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateEmployee(id: string, input: EmployeeInputSchema, organizationId: string): Promise<Employee | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toEmployee(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteEmployee(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
