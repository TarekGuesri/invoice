import Link from 'next/link'
import type { ReactNode } from 'react'

import { Logo } from '@/components/ui/Logo'

interface AuthShellProps {
	title: string
	subtitle: string
	children: ReactNode
	footer: ReactNode
}

export function AuthShell({
	title,
	subtitle,
	children,
	footer,
}: AuthShellProps) {
	return (
		<main className='flex min-h-dvh flex-col items-center justify-center bg-zinc-50/60 px-4 py-12'>
			<Link href='/' className='mb-8'>
				<Logo />
			</Link>
			<div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8'>
				<h1 className='text-xl font-semibold tracking-tight'>
					{title}
				</h1>
				<p className='mt-1 text-sm text-zinc-600'>{subtitle}</p>
				<div className='mt-6'>{children}</div>
			</div>
			<p className='mt-6 text-sm text-zinc-600'>{footer}</p>
		</main>
	)
}
