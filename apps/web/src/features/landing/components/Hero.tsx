import { buttonClasses } from '@/components/ui/button-classes'
import { GitHubIcon } from '@/components/ui/icons'

import { LINKS } from '@/lib/links'

import { PipelinePreview } from './PipelinePreview'

export function Hero() {
	return (
		<section className='mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]'>
			<div>
				<p className='mb-4 inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600'>
					AI receipt &amp; invoice inbox for freelancers
				</p>
				<h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
					Drop in receipts. Get bookkeeping-ready data.
				</h1>
				<p className='mt-5 max-w-xl text-lg text-pretty text-zinc-600'>
					Invoice reads receipts and invoices in any language and
					currency, extracts vendor, dates, amounts and tax, and flags
					anything uncertain for a quick review before it reaches your
					accountant.
				</p>
				<div className='mt-8 flex flex-wrap items-center gap-3'>
					<button
						type='button'
						className={buttonClasses('primary')}
						disabled
						aria-describedby='demo-note'
					>
						Try the demo
					</button>
					<a
						href={LINKS.github}
						className={buttonClasses('secondary')}
					>
						<GitHubIcon className='size-4' />
						View on GitHub
					</a>
				</div>
				<p id='demo-note' className='mt-3 text-sm text-zinc-500'>
					The one-click demo opens once the extraction pipeline ships.
					Follow the build on GitHub.
				</p>
			</div>
			<PipelinePreview />
		</section>
	)
}
