'use client'

import { useRouter } from 'next/navigation'

import { useLogoutMutation } from '../api'

export function LogoutButton() {
	const router = useRouter()
	const logout = useLogoutMutation()

	return (
		<button
			type='button'
			disabled={logout.isPending}
			onClick={() =>
				logout.mutate(undefined, {
					onSettled: () => router.replace('/login'),
				})
			}
			className='rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-60'
		>
			Log out
		</button>
	)
}
