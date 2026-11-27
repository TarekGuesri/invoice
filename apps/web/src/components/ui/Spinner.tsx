interface SpinnerProps {
	className?: string
}

export function Spinner({ className = 'size-4' }: SpinnerProps) {
	return (
		<span
			className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
			aria-hidden
		/>
	)
}
