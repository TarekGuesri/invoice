import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ApiError } from './api-client'

/**
 * Puts an API error on the form: field-level validation issues next to their
 * inputs, everything else in `errors.root.server`.
 */
export function applyServerError<T extends FieldValues>(
	error: unknown,
	setError: UseFormSetError<T>,
	fields: readonly Path<T>[]
) {
	if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
		const fieldIssues = error.details.filter((issue) =>
			fields.includes(issue.path as Path<T>)
		)
		for (const issue of fieldIssues) {
			setError(issue.path as Path<T>, { message: issue.message })
		}
		if (fieldIssues.length > 0) return
	}

	setError('root.server', { message: describeError(error) })
}

export function describeError(error: unknown) {
	if (!(error instanceof ApiError)) {
		return "Couldn't reach the server. Check your connection and try again."
	}
	if (error.code === 'TOO_MANY_REQUESTS') {
		return 'Too many attempts. Wait a minute and try again.'
	}
	if (error.code && error.status < 500) return error.message
	return 'Something went wrong on our side. Please try again.'
}
