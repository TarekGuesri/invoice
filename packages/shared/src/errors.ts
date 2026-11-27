import { z } from 'zod'

/** Machine-readable error codes the clients can branch on. */
export const ErrorCodeSchema = z.enum([
	'BAD_REQUEST',
	'VALIDATION_FAILED',
	'UNAUTHORIZED',
	'INVALID_CREDENTIALS',
	'FORBIDDEN',
	'FORBIDDEN_ORIGIN',
	'NOT_FOUND',
	'CONFLICT',
	'EMAIL_TAKEN',
	'TOO_MANY_REQUESTS',
	'INTERNAL_ERROR',
])

export const ValidationIssueSchema = z.object({
	path: z.string(),
	message: z.string(),
})

/** Every non-2xx response from the API has this shape. */
export const ApiErrorResponseSchema = z.object({
	error: z.object({
		code: ErrorCodeSchema,
		message: z.string(),
		details: z.array(ValidationIssueSchema).optional(),
	}),
})

export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
