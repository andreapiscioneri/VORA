import { z } from 'zod'
import { scorePassword } from './password'

// Below 8 chars fails the length check with its own message first; at 8+
// chars this only rejects genuinely weak passwords (fewer than 3 of
// lowercase/uppercase/digit/symbol) — e.g. "aaaaaaaa" or "12345678" still
// fail here even though they clear min(8). See scorePassword in password.ts
// (also used by the strength-meter UI) for the exact rule.
const strongPassword = z
  .string()
  .min(8, 'auth.passwordTooShort')
  .refine((v) => !scorePassword(v).weak, 'auth.passwordTooWeak')

export const registerSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: strongPassword,
  organizationName: z.string().min(1, 'validation.required'),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'validation.required'),
  password: strongPassword,
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.required'),
  newPassword: strongPassword,
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
