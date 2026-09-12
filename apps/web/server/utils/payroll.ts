import type { PayrollRecord } from '~/shared/types/payroll'
import type { PayrollRecordInputSchema } from '~/shared/validation/payroll'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'payrollRecords'

function toRecord(id: string, data: FirebaseFirestore.DocumentData): PayrollRecord {
  return {
    id,
    employeeName: data.employeeName ?? '',
    period: data.period ?? '',
    grossAmount: data.grossAmount ?? 0,
    netAmount: data.netAmount ?? 0,
    status: data.status ?? 'draft',
    payslipUrl: data.payslipUrl ?? '',
    paidAt: data.paidAt ?? null,
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listPayrollRecords(
  organizationId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<PayrollRecord>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toRecord)
}

export async function createPayrollRecord(input: PayrollRecordInputSchema, organizationId: string): Promise<PayrollRecord> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toRecord(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updatePayrollRecord(
  id: string,
  input: PayrollRecordInputSchema,
  organizationId: string,
): Promise<PayrollRecord | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toRecord(id, { ...existing.data(), ...input, updatedAt })
}

export async function deletePayrollRecord(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
