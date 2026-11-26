'use client'

import { useHealthQuery } from '../api'

const TONES = {
	pending: 'bg-zinc-400 animate-pulse',
	ok: 'bg-emerald-500',
	degraded: 'bg-amber-500',
	down: 'bg-rose-500',
} as const

export function ApiStatus() {
	const { data, isPending, isError } = useHealthQuery()

	const tone = isPending
		? 'pending'
		: isError
			? 'down'
			: data.status === 'ok'
				? 'ok'
				: 'degraded'
	const label = {
		pending: 'Waking up the API…',
		ok: 'All systems operational',
		degraded: 'Partial outage',
		down: 'API unreachable',
	}[tone]
	const version = data?.version.slice(0, 7)
	const details = data
		? `Database: ${data.checks.database.status} · Redis: ${data.checks.redis.status} · Worker: ${data.checks.worker.status}`
		: undefined

	return (
		<p
			className='inline-flex items-center gap-2 text-sm text-zinc-500'
			title={details}
			aria-live='polite'
		>
			<span
				className={`size-2 rounded-full ${TONES[tone]}`}
				aria-hidden
			/>
			{label}
			{version && (
				<span className='font-mono text-xs text-zinc-400'>
					{version}
				</span>
			)}
		</p>
	)
}
