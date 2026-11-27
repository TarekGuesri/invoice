import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 10
/** Caps the work argon2 does per request. */
export const PASSWORD_MAX_LENGTH = 128

export const EmailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email('Enter a valid email address').max(254))

export const RoleSchema = z.enum(['USER', 'DEMO'])

export const RegisterRequestSchema = z.object({
	email: EmailSchema,
	password: z
		.string()
		.min(
			PASSWORD_MIN_LENGTH,
			`Use at least ${PASSWORD_MIN_LENGTH} characters`
		)
		.max(
			PASSWORD_MAX_LENGTH,
			`Use at most ${PASSWORD_MAX_LENGTH} characters`
		),
})

/** No length rules on login, so a policy change never locks anyone out. */
export const LoginRequestSchema = z.object({
	email: EmailSchema,
	password: z.string().min(1, 'Enter your password').max(PASSWORD_MAX_LENGTH),
})

export const UserSchema = z.object({
	id: z.string(),
	email: z.string(),
	role: RoleSchema,
	createdAt: z.iso.datetime(),
})

/** Returned by register, login and refresh. Tokens travel only in cookies. */
export const AuthResponseSchema = z.object({
	user: UserSchema,
})

export const MeResponseSchema = z.object({
	user: UserSchema,
})

export type Role = z.infer<typeof RoleSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type User = z.infer<typeof UserSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type MeResponse = z.infer<typeof MeResponseSchema>
