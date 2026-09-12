// Data/document management only — no automatic tax engine (IRPEF/INPS/INAIL).
// All amounts are manually entered or imported; Vora never computes them.
export const PAYROLL_STATUSES = ['draft', 'issued', 'paid'] as const
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number]

export interface PayrollRecord {
  id: string
  employeeName: string
  period: string
  grossAmount: number
  netAmount: number
  status: PayrollStatus
  payslipUrl: string
  paidAt: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export type PayrollRecordInput = Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>
