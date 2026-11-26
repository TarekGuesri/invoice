import { ArrowRightIcon } from '@/components/ui/icons'

const FLOW = [
	{ name: 'Next.js', where: 'Vercel' },
	{ name: 'NestJS API', where: 'Cloud Run' },
	{ name: 'BullMQ queue', where: 'Redis Cloud' },
	{ name: 'Worker', where: 'GCP VM' },
	{ name: 'Gemini', where: 'Google AI' },
]

export function ArchitectureOverview() {
	return (
		<section
			aria-labelledby='architecture-title'
			className='mx-auto max-w-6xl px-4 py-16'
		>
			<div className='max-w-2xl'>
				<h2
					id='architecture-title'
					className='text-2xl font-semibold tracking-tight'
				>
					How it&apos;s built
				</h2>
				<p className='mt-3 text-zinc-600'>
					Files upload straight to Cloudflare R2 through presigned
					URLs. A BullMQ worker on its own VM does the slow LLM work,
					so API requests stay fast, and status changes stream back
					over WebSockets. Postgres runs on Neon. The whole stack runs
					on free tiers for $0 a month.
				</p>
			</div>
			<ol className='mt-8 flex flex-wrap items-center gap-2'>
				{FLOW.map((step, index) => (
					<li key={step.name} className='flex items-center gap-2'>
						<span className='rounded-lg border border-zinc-200 bg-white px-3 py-2'>
							<span className='block text-sm font-medium'>
								{step.name}
							</span>
							<span className='block text-xs text-zinc-500'>
								{step.where}
							</span>
						</span>
						{index < FLOW.length - 1 && (
							<ArrowRightIcon className='size-4 text-zinc-400' />
						)}
					</li>
				))}
			</ol>
		</section>
	)
}
