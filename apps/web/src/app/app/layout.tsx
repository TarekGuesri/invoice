import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AppHeader } from '@/components/layout/AppHeader'

import { RequireAuth } from '@/features/auth/components/RequireAuth'

export const metadata: Metadata = {
	title: 'invoice',
	robots: { index: false },
}

interface AppLayoutProps {
	children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
	return (
		<RequireAuth>
			<div className='min-h-dvh bg-zinc-50/60'>
				<AppHeader />
				<main className='mx-auto max-w-6xl px-4 py-10'>{children}</main>
			</div>
		</RequireAuth>
	)
}
