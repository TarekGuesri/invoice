import { HealthResponseSchema } from '@repo/shared'
import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-client'

export const healthKeys = {
	all: ['health'] as const,
}

export function fetchHealth() {
	// A degraded API answers 503 with the same body, which the UI still shows.
	return apiFetch('/health', HealthResponseSchema, {
		allowedStatuses: [503],
	})
}

export function useHealthQuery() {
	return useQuery({
		queryKey: healthKeys.all,
		queryFn: fetchHealth,
		staleTime: 60_000,
		retry: 1,
	})
}
