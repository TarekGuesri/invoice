'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PASSWORD_MIN_LENGTH, RegisterRequestSchema } from '@repo/shared'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/ui/FormError'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { buttonClasses } from '@/components/ui/button-classes'

import { ApiError } from '@/lib/api-client'
import { applyServerError } from '@/lib/form-errors'

import { useRegisterMutation } from '../api'
import { useRedirectIfSignedIn } from '../hooks/use-redirect-if-signed-in'

interface RegisterFormProps {
	next: string
}

export function RegisterForm({ next }: RegisterFormProps) {
	const registerAccount = useRegisterMutation()
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(RegisterRequestSchema) })

	// Also handles the redirect after a successful submit.
	useRedirectIfSignedIn(next)

	const onSubmit = handleSubmit(async (values) => {
		try {
			await registerAccount.mutateAsync(values)
		} catch (error) {
			if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
				setError('email', { message: error.message })
				return
			}
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
				autoComplete='new-password'
				hint={`At least ${PASSWORD_MIN_LENGTH} characters. A short sentence works well.`}
				error={errors.password?.message}
				{...register('password')}
			/>
			<button
				type='submit'
				className={`${buttonClasses('primary')} w-full`}
				disabled={isSubmitting}
			>
				{isSubmitting && <Spinner />}
				Create account
			</button>
		</form>
	)
}
