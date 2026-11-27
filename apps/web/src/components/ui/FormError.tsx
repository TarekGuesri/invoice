interface FormErrorProps {
	message?: string
}

/** A form-level error, announced to screen readers when it appears. */
export function FormError({ message }: FormErrorProps) {
	return (
		<div role='alert' aria-live='assertive'>
			{message && (
				<p className='rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200'>
					{message}
				</p>
			)}
		</div>
	)
}
