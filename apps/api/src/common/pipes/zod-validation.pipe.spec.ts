import { RegisterRequestSchema } from '@repo/shared'

import { ApiException } from '../errors/api-exception'
import { ZodValidationPipe } from './zod-validation.pipe'

describe('ZodValidationPipe', () => {
	const pipe = new ZodValidationPipe(RegisterRequestSchema)

	it('returns the parsed value with the schema transforms applied', () => {
		expect(
			pipe.transform({
				email: '  Freelancer@Example.COM ',
				password: 'correct horse battery',
			})
		).toEqual({
			email: 'freelancer@example.com',
			password: 'correct horse battery',
		})
	})

	it('throws VALIDATION_FAILED with one issue per invalid field', () => {
		let error: unknown
		try {
			pipe.transform({ email: 'not-an-email', password: 'short' })
		} catch (caught) {
			error = caught
		}

		expect(error).toBeInstanceOf(ApiException)
		expect(error).toMatchObject({
			code: 'VALIDATION_FAILED',
			details: [
				{ path: 'email', message: 'Enter a valid email address' },
				{ path: 'password', message: 'Use at least 10 characters' },
			],
		})
	})

	it('rejects a missing body', () => {
		expect(() => pipe.transform(undefined)).toThrow(ApiException)
	})
})
