const BASE =
	'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const SIZES = {
	md: 'px-4 py-2.5',
	sm: 'px-3 py-1.5',
} as const

const VARIANTS = {
	primary:
		'bg-zinc-900 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-900',
	secondary:
		'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 disabled:hover:bg-white',
} as const

export type ButtonVariant = keyof typeof VARIANTS
export type ButtonSize = keyof typeof SIZES

/** Shared by <button> and <a> so links can look like buttons. */
export function buttonClasses(
	variant: ButtonVariant = 'primary',
	size: ButtonSize = 'md'
) {
	return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`
}
