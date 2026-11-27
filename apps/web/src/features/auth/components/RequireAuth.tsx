'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { Spinner } from '@/components/ui/Spinner'

import { describeError } from '@/lib/form-errors'

import { useSessionQuery } from '../api'

interface RequireAuthProps {
	children: ReactNode
}

/**
 * Client-side gate for `/app`. The auth cookies belong to the API's host, so
 * the Next.js server can't see them; the API still checks every request.
 */
export function RequireAuth({ children }: RequireAuthProps) {
	const router = useRouter()
	const pathname = usePathname()
	const {
		data: session,
		isPending,
		isError,
		error,
		refetch,
	} = useSessionQuery()

	useEffect(() => {
		if (session === null) {
			router.replace(`/login?next=${encodeURIComponent(pathname)}`)
		}
	}, [session, pathname, router])

	if (isError) {
		return (
			<div className='grid min-h-dvh place-items-center px-4 text-center'>
				<div role='alert'>
					<p className='text-sm text-zinc-600'>
						{describeError(error)}
					</p>
					<button
						type='button'
						onClick={() => void refetch()}
						className='mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500'
					>
						Try again
					</button>
				</div>
			</div>
		)
	}

	if (isPending || !session) {
		return (
			<div className='grid min-h-dvh place-items-center text-zinc-400'>
				<Spinner className='size-6' />
				<span className='sr-only'>Loading your account…</span>
			</div>
		)
	}

	return children
}
