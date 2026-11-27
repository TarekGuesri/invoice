'use client'

import Link from 'next/link'

import { Logo } from '@/components/ui/Logo'

import { useSessionQuery } from '@/features/auth/api'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

export function AppHeader() {
	const { data: session } = useSessionQuery()

	return (
		<header className='border-b border-zinc-200 bg-white'>
			<div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4'>
				<Link href='/app'>
					<Logo />
				</Link>
				<div className='flex min-w-0 items-center gap-3'>
					<span className='truncate text-sm text-zinc-500'>
						{session?.user.email}
					</span>
					<LogoutButton />
				</div>
			</div>
		</header>
	)
}
