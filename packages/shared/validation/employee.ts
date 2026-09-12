import { z } from 'zod'
import { EMPLOYEE_STATUSES, EMPLOYEE_DOCUMENT_TYPES } from '../types/employee'

export const employeeDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  type: z.enum(EMPLOYEE_DOCUMENT_TYPES),
  expiryDate: z.string().nullable(),
  url: z.string().trim().url(),
  addedAt: z.string(),
})

export const employeeInputSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required').max(80),
  lastName: z.string().trim().min(1, 'validation.required').max(80),
  email: z.union([z.string().trim().email('validation.email'), z.literal('')]).default(''),
  role: z.string().trim().max(120).default(''),
  team: z.string().trim().max(120).default(''),
  status: z.enum(EMPLOYEE_STATUSES).default('active'),
  startDate: z.string().nullable().default(null),
  managerId: z.string().nullable().default(null),
  documents: z.array(employeeDocumentSchema).default([]),
})

export type EmployeeInputSchema = z.infer<typeof employeeInputSchema>

export const addEmployeeDocumentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  type: z.enum(EMPLOYEE_DOCUMENT_TYPES).default('other'),
  expiryDate: z.string().nullable().default(null),
  url: z.string().trim().url('validation.url'),
})

export type AddEmployeeDocumentSchema = z.infer<typeof addEmployeeDocumentSchema>
