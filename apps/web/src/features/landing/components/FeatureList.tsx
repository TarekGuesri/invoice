import { ActivityIcon, SparklesIcon, TableIcon } from '@/components/ui/icons'

const FEATURES = [
	{
		icon: SparklesIcon,
		title: 'Extraction that shows its work',
		body: 'Gemini returns structured output that is validated field by field. Every value has a confidence score, and anything below the bar goes to a review queue instead of your books.',
	},
	{
		icon: ActivityIcon,
		title: 'Live pipeline status',
		body: 'Each upload moves from queued to processing to done in real time. Rate limits, retries and duplicate files are handled for you, so nothing gets lost or processed twice.',
	},
	{
		icon: TableIcon,
		title: 'Ready for your accountant',
		body: 'Spending by category and month, tax totals per currency, and a clean CSV export. Export or delete all of your data at any time.',
	},
]

export function FeatureList() {
	return (
		<section
			aria-labelledby='features-title'
			className='border-y border-zinc-100 bg-zinc-50/60'
		>
			<div className='mx-auto max-w-6xl px-4 py-16'>
				<h2 id='features-title' className='sr-only'>
					Features
				</h2>
				<ul className='grid gap-10 md:grid-cols-3'>
					{FEATURES.map(({ icon: Icon, title, body }) => (
						<li key={title}>
							<span className='grid size-10 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-zinc-200'>
								<Icon className='size-5' />
							</span>
							<h3 className='mt-4 font-semibold'>{title}</h3>
							<p className='mt-2 text-sm leading-6 text-zinc-600'>
								{body}
							</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}
