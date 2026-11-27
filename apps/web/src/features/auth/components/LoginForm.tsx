'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoginRequestSchema } from '@repo/shared'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/ui/FormError'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { buttonClasses } from '@/components/ui/button-classes'

import { applyServerError } from '@/lib/form-errors'

import { useLoginMutation } from '../api'
import { useRedirectIfSignedIn } from '../hooks/use-redirect-if-signed-in'

interface LoginFormProps {
	next: string
}

export function LoginForm({ next }: LoginFormProps) {
	const login = useLoginMutation()
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(LoginRequestSchema) })

	// Also handles the redirect after a successful submit.
	useRedirectIfSignedIn(next)

	const onSubmit = handleSubmit(async (values) => {
		try {
			await login.mutateAsync(values)
		} catch (error) {
			applyServerError(error, setError, ['email', 'password'])
		}
	})

	return (
		<form
			onSubmit={(event) => void onSubmit(event)}
			noValidate
			className='space-y-4'
		>
			<FormError message={errors.root?.server?.message} />
			<TextField
				label='Email'
				type='email'
				autoComplete='email'
				autoFocus
				error={errors.email?.message}
				{...register('email')}
			/>
			<TextField
				label='Password'
				type='password'
				autoComplete='current-password'
				error={errors.password?.message}
				{...register('password')}
			/>
			<button
				type='submit'
				className={`${buttonClasses('primary')} w-full`}
				disabled={isSubmitting}
			>
				{isSubmitting && <Spinner />}
				Log in
			</button>
		</form>
	)
}
