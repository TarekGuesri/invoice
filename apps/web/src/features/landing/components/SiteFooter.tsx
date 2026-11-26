import { LINKS } from '@/lib/links'

import { ApiStatus } from '@/features/health/components/ApiStatus'

const FOOTER_LINKS = [
	{ label: 'GitHub', href: LINKS.github },
	{ label: 'Self-hosting', href: LINKS.selfHosting },
	{ label: 'Contributing', href: LINKS.contributing },
]

export function SiteFooter() {
	return (
		<footer className='border-t border-zinc-100'>
			<div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex flex-col gap-2'>
					<p>
						Open source under the{' '}
						<a
							href={LINKS.license}
							className='font-medium text-zinc-700 hover:text-zinc-900'
						>
							MIT license
						</a>
					</p>
					<ul className='flex gap-4'>
						{FOOTER_LINKS.map((link) => (
							<li key={link.href}>
								<a
									href={link.href}
									className='hover:text-zinc-900'
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</div>
				<ApiStatus />
			</div>
		</footer>
	)
}
