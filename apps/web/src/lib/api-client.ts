import type { z } from 'zod'

import { env } from './env'

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message)
		this.name = 'ApiError'
	}
}

interface ApiFetchOptions extends RequestInit {
	/** Non-2xx statuses whose body should still be parsed and returned. */
	allowedStatuses?: number[]
}

export async function apiFetch<T>(
	path: string,
	schema: z.ZodType<T>,
	{ allowedStatuses = [], headers, ...init }: ApiFetchOptions = {}
): Promise<T> {
	const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
		credentials: 'include',
		...init,
		headers: { Accept: 'application/json', ...headers },
	})
	const body: unknown = await res.json().catch(() => null)

	if (!res.ok && !allowedStatuses.includes(res.status)) {
		throw new ApiError(res.status, `Request to ${path} failed`)
	}

	return schema.parse(body)
}
