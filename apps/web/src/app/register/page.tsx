import type { Metadata } from 'next'
import Link from 'next/link'

import { safeRedirectPath } from '@/lib/safe-redirect'

import { AuthShell } from '@/features/auth/components/AuthShell'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export const metadata: Metadata = { title: 'Create an account · invoice' }

export default async function RegisterPage({
	searchParams,
}: PageProps<'/register'>) {
	const next = safeRedirectPath((await searchParams).next)

	return (
		<AuthShell
			title='Create an account'
			subtitle='Free and open source. Export or delete your data at any time.'
			footer={
				<>
					Already have an account?{' '}
					<Link
						href={{ pathname: '/login', query: { next } }}
						className='font-medium text-indigo-600 hover:text-indigo-500'
					>
						Log in
					</Link>
				</>
			}
		>
			<RegisterForm next={next} />
		</AuthShell>
	)
}
