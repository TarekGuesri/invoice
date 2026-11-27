import { AuthResponseSchema, MeResponseSchema } from '@repo/shared'
import type { LoginRequest, MeResponse, RegisterRequest } from '@repo/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, apiFetch } from '@/lib/api-client'

export const authKeys = {
	session: ['auth', 'session'] as const,
}

/** The signed-in user, or null for a visitor (instead of an error). */
export async function fetchSession(): Promise<MeResponse | null> {
	try {
		return await apiFetch('/me', MeResponseSchema)
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) return null
		throw error
	}
}

export function useSessionQuery() {
	return useQuery({
		queryKey: authKeys.session,
		queryFn: fetchSession,
		staleTime: 5 * 60_000,
		retry: 1,
	})
}

export function useLoginMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: LoginRequest) =>
			apiFetch('/auth/login', AuthResponseSchema, {
				method: 'POST',
				json: body,
			}),
		onSuccess: (session) => {
			queryClient.setQueryData(authKeys.session, session)
		},
	})
}

export function useRegisterMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: RegisterRequest) =>
			apiFetch('/auth/register', AuthResponseSchema, {
				method: 'POST',
				json: body,
			}),
		onSuccess: (session) => {
			queryClient.setQueryData(authKeys.session, session)
		},
	})
}

export function useLogoutMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: () =>
			apiFetch('/auth/logout', z.null(), { method: 'POST' }),
		// Drop every cached query, so the next user starts clean.
		onSettled: () => {
			queryClient.clear()
			queryClient.setQueryData(authKeys.session, null)
		},
	})
}
