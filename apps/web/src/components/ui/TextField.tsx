import { useId } from 'react'
import type { ComponentProps } from 'react'

interface TextFieldProps extends ComponentProps<'input'> {
	label: string
	error?: string
	hint?: string
}

export function TextField({
	label,
	error,
	hint,
	className,
	...inputProps
}: TextFieldProps) {
	const id = useId()
	const hintId = `${id}-hint`
	const errorId = `${id}-error`
	const describedBy =
		[error && errorId, hint && hintId].filter(Boolean).join(' ') ||
		undefined

	return (
		<div className={className}>
			<label htmlFor={id} className='block text-sm font-medium'>
				{label}
			</label>
			<input
				id={id}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy}
				className='mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-xs placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-600/20 aria-invalid:border-rose-500'
				{...inputProps}
			/>
			{hint && !error && (
				<p id={hintId} className='mt-1.5 text-xs text-zinc-500'>
					{hint}
				</p>
			)}
			{error && (
				<p id={errorId} className='mt-1.5 text-xs text-rose-600'>
					{error}
				</p>
			)}
		</div>
	)
}
