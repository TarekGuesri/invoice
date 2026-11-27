import { buttonClasses } from '@/components/ui/button-classes'
import { GitHubIcon, SparklesIcon } from '@/components/ui/icons'

import { LINKS } from '@/lib/links'

/** Shown until uploads ship (M2); replaced by the dashboard in M4. */
export function InboxEmptyState() {
	return (
		<section className='rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-zinc-200'>
			<span className='mx-auto grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600'>
				<SparklesIcon className='size-6' />
			</span>
			<h1 className='mt-5 text-xl font-semibold tracking-tight'>
				Your inbox is ready
			</h1>
			<p className='mx-auto mt-2 max-w-md text-sm text-pretty text-zinc-600'>
				Uploading receipts and invoices arrives in the next release.
				Your account is set up, so they’ll land here as soon as it
				ships.
			</p>
			<a
				href={LINKS.github}
				className={`${buttonClasses('secondary')} mt-6`}
			>
				<GitHubIcon className='size-4' />
				Follow progress on GitHub
			</a>
		</section>
	)
}
