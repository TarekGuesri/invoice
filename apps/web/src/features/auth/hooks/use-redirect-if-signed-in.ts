import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSessionQuery } from '../api'

/** Sends visitors who already have a session past the login/register forms. */
export function useRedirectIfSignedIn(next: string) {
	const router = useRouter()
	const { data: session } = useSessionQuery()

	useEffect(() => {
		if (session) router.replace(next)
	}, [session, next, router])
}
