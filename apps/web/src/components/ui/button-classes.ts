const BASE =
	'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS = {
	primary:
		'bg-zinc-900 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-900',
	secondary:
		'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 disabled:hover:bg-white',
} as const

export type ButtonVariant = keyof typeof VARIANTS

/** Shared by <button> and <a> so links can look like buttons. */
export function buttonClasses(variant: ButtonVariant = 'primary') {
	return `${BASE} ${VARIANTS[variant]}`
}
