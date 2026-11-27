import Link from 'next/link'

import { Logo } from '@/components/ui/Logo'
import { buttonClasses } from '@/components/ui/button-classes'
import { GitHubIcon } from '@/components/ui/icons'

import { LINKS } from '@/lib/links'

export function SiteHeader() {
	return (
		<header className='border-b border-zinc-100'>
			<div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4'>
				<Link href='/'>
					<Logo />
				</Link>
				<nav className='flex items-center gap-1 sm:gap-2'>
					<a
						href={LINKS.github}
						aria-label='Source code on GitHub'
						className='inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-zinc-600 hover:text-zinc-900'
					>
						<GitHubIcon className='size-4' />
						<span className='hidden sm:inline' aria-hidden>
							Source code
						</span>
					</a>
					<Link
						href='/login'
						className='rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:text-zinc-900'
					>
						Log in
					</Link>
					<Link
						href='/register'
						className={buttonClasses('primary', 'sm')}
					>
						Sign up
					</Link>
				</nav>
			</div>
		</header>
	)
}
