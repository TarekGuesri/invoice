import type { Metadata } from 'next'
import Link from 'next/link'

import { safeRedirectPath } from '@/lib/safe-redirect'

import { AuthShell } from '@/features/auth/components/AuthShell'
import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata: Metadata = { title: 'Log in · invoice' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
	const next = safeRedirectPath((await searchParams).next)

	return (
		<AuthShell
			title='Log in'
			subtitle='Welcome back. Your receipts are where you left them.'
			footer={
				<>
					New here?{' '}
					<Link
						href={{ pathname: '/register', query: { next } }}
						className='font-medium text-indigo-600 hover:text-indigo-500'
					>
						Create an account
					</Link>
				</>
			}
		>
			<LoginForm next={next} />
		</AuthShell>
	)
}
