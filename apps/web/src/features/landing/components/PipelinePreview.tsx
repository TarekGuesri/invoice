const ROWS = [
	{
		vendor: 'Blue Harbor Coffee Roasters',
		meta: 'Meals · 14 Nov 2026',
		amount: '€18.40',
		status: 'Done',
		tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
	},
	{
		vendor: 'Pixelforge Software Ltd',
		meta: 'Software · date unclear',
		amount: '$49.00',
		status: 'Needs review',
		tone: 'bg-amber-50 text-amber-800 ring-amber-600/20',
	},
	{
		vendor: 'Meridian Coworking',
		meta: 'Rent & utilities',
		amount: '£320.00',
		status: 'Processing',
		tone: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
		spinning: true,
	},
	{
		vendor: 'receipt_0412.heic',
		meta: 'Uploaded just now',
		amount: '—',
		status: 'Queued',
		tone: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
	},
]

/** A static illustration of the documents list. */
export function PipelinePreview() {
	return (
		<figure className='rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/5'>
			<div className='flex items-center justify-between px-3 py-2'>
				<p className='text-sm font-medium'>Documents</p>
				<p className='text-xs text-zinc-400'>Updates live</p>
			</div>
			<ul className='divide-y divide-zinc-100 rounded-xl border border-zinc-100'>
				{ROWS.map((row) => (
					<li
						key={row.vendor}
						className='flex items-center gap-3 px-3 py-3'
					>
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-medium'>
								{row.vendor}
							</p>
							<p className='truncate text-xs text-zinc-500'>
								{row.meta}
							</p>
						</div>
						<p className='hidden font-mono text-sm tabular-nums text-zinc-700 sm:block'>
							{row.amount}
						</p>
						<span
							className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${row.tone}`}
						>
							{row.spinning && (
								<span
									className='size-3 animate-spin rounded-full border-2 border-current border-t-transparent'
									aria-hidden
								/>
							)}
							{row.status}
						</span>
					</li>
				))}
			</ul>
			<figcaption className='sr-only'>
				Example documents moving through the extraction pipeline
			</figcaption>
		</figure>
	)
}
