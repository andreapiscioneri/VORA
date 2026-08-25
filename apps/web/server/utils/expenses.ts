import type { Expense } from '~/shared/types/expense'
import type { ExpenseInputSchema } from '~/shared/validation/expense'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'expenses'

function toExpense(id: string, data: FirebaseFirestore.DocumentData): Expense {
  return {
    id,
    amount: data.amount ?? 0,
    currency: data.currency ?? 'EUR',
    category: data.category ?? 'other',
    date: data.date ?? '',
    projectId: data.projectId ?? null,
    contactId: data.contactId ?? null,
    status: data.status ?? 'pending',
    notes: data.notes ?? '',
    receiptUrl: data.receiptUrl ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listExpenses(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Expense>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toExpense)
}

export async function getExpense(id: string, organizationId: string): Promise<Expense | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toExpense(doc.id, doc.data()!)
}

export async function createExpense(input: ExpenseInputSchema, organizationId: string): Promise<Expense> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toExpense(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateExpense(id: string, input: ExpenseInputSchema, organizationId: string): Promise<Expense | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toExpense(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteExpense(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
