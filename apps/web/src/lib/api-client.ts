import { ApiErrorResponseSchema } from '@repo/shared'
import type { ErrorCode, ValidationIssue } from '@repo/shared'
import type { z } from 'zod'

import { env } from './env'

export class ApiError extends Error {
	constructor(
		readonly status: number,
		/** Undefined when the response wasn't the API's error shape. */
		readonly code: ErrorCode | undefined,
		message: string,
		readonly details: ValidationIssue[] = []
	) {
		super(message)
		this.name = 'ApiError'
	}
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
	/** Non-2xx statuses whose body should still be parsed and returned. */
	allowedStatuses?: number[]
	/** Sent as a JSON body. */
	json?: unknown
}

/** Shared by concurrent requests, so one expired token triggers one refresh. */
let refreshInFlight: Promise<boolean> | undefined

function refreshSession() {
	refreshInFlight ??= fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
		method: 'POST',
		credentials: 'include',
	})
		.then((res) => res.ok)
		.catch(() => false)
		.finally(() => {
			refreshInFlight = undefined
		})
	return refreshInFlight
}

export async function apiFetch<T>(
	path: string,
	schema: z.ZodType<T>,
	{ allowedStatuses = [], json, headers, ...init }: ApiFetchOptions = {}
): Promise<T> {
	const send = () =>
		fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
			credentials: 'include',
			...init,
			headers: {
				Accept: 'application/json',
				...(json === undefined
					? {}
					: { 'Content-Type': 'application/json' }),
				...headers,
			},
			body: json === undefined ? undefined : JSON.stringify(json),
		})

	let res = await send()
	// The access token lives 15 minutes. Auth routes answer 401 for their own
	// reasons (wrong password), so they never trigger a refresh.
	if (
		res.status === 401 &&
		!path.startsWith('/auth/') &&
		(await refreshSession())
	) {
		res = await send()
	}

	// 204 and non-JSON bodies parse as null.
	const body: unknown = await res.json().catch(() => null)

	if (!res.ok && !allowedStatuses.includes(res.status)) {
		const parsed = ApiErrorResponseSchema.safeParse(body)
		if (parsed.success) {
			const { code, message, details } = parsed.data.error
			throw new ApiError(res.status, code, message, details)
		}
		throw new ApiError(res.status, undefined, `Request to ${path} failed`)
	}

	return schema.parse(body)
}
