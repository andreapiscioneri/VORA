import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(8, 'auth.passwordTooShort'),
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
  password: z.string().min(8, 'auth.passwordTooShort'),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.required'),
  newPassword: z.string().min(8, 'auth.passwordTooShort'),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
