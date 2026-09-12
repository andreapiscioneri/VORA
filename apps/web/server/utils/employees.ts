import type { Employee } from '~/shared/types/employee'
import type { EmployeeInputSchema, AddEmployeeDocumentSchema } from '~/shared/validation/employee'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'
import { findUserByEmail, getPrimaryMembership } from './auth'

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
    managerId: data.managerId ?? null,
    documents: data.documents ?? [],
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

export async function addEmployeeDocument(id: string, input: AddEmployeeDocumentSchema, organizationId: string): Promise<Employee | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const document = { id: crypto.randomUUID(), title: input.title, type: input.type, expiryDate: input.expiryDate, url: input.url, addedAt: new Date().toISOString() }
  const documents = [...(existing.data()?.documents ?? []), document]
  const updatedAt = new Date().toISOString()
  await ref.update({ documents, updatedAt })
  return toEmployee(id, { ...existing.data(), documents, updatedAt })
}

export async function removeEmployeeDocument(id: string, documentId: string, organizationId: string): Promise<Employee | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const documents = ((existing.data()?.documents ?? []) as { id: string }[]).filter((d) => d.id !== documentId)
  const updatedAt = new Date().toISOString()
  await ref.update({ documents, updatedAt })
  return toEmployee(id, { ...existing.data(), documents, updatedAt })
}

// Resolves an employee's manager to a logged-in-capable user id, so an
// approval (leave, expenses, ...) can be routed to "this employee's actual
// manager" rather than any owner/admin. Employee records have no direct
// link to a User account — the only bridge is email — so this fails closed
// (returns null) at any missing link: no manager set, no Employee record
// for the manager, no User with that email, or that user not a member of
// this same organization. A null result means "no manager to route to",
// not an error; callers fall back to the owner/admin gate.
export async function resolveManagerUserId(employeeId: string | null, organizationId: string): Promise<string | null> {
  if (!employeeId) return null
  const employee = await getEmployee(employeeId, organizationId)
  if (!employee?.managerId) return null
  return resolveEmployeeUserId(employee.managerId, organizationId)
}

// Resolves an employee directly to the user account sharing its email, for
// notifying "this specific employee" (e.g. a ticket assignment) rather than
// their manager. Same email-bridge, same fail-closed behavior — see
// resolveManagerUserId above for why this can't be a stronger guarantee.
export async function resolveEmployeeUserId(employeeId: string | null, organizationId: string): Promise<string | null> {
  if (!employeeId) return null
  const employee = await getEmployee(employeeId, organizationId)
  if (!employee?.email) return null
  const user = await findUserByEmail(employee.email)
  if (!user) return null
  const membership = await getPrimaryMembership(user.id)
  if (!membership || membership.organizationId !== organizationId) return null
  return user.id
}
