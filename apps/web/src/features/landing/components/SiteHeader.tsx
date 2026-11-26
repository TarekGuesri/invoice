import Link from 'next/link'

import { GitHubIcon } from '@/components/ui/icons'

import { LINKS } from '@/lib/links'

export function SiteHeader() {
	return (
		<header className='border-b border-zinc-100'>
			<div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4'>
				<Link
					href='/'
					className='flex items-center gap-2 font-semibold'
				>
					<span
						className='grid size-7 place-items-center rounded-md bg-zinc-900 text-xs font-bold text-white'
						aria-hidden
					>
						in
					</span>
					invoice
				</Link>
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
			</div>
		</header>
	)
}
