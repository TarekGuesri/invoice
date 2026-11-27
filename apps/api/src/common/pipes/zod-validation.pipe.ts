import { HttpStatus, PipeTransform } from '@nestjs/common'
import type { z } from 'zod'

import { ApiException } from '../errors/api-exception'

/**
 * Validates a request part against a shared Zod schema and returns the parsed
 * (trimmed, lowercased, defaulted…) value:
 * `@Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest`.
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
	constructor(private readonly schema: T) {}

	transform(value: unknown): z.output<T> {
		const parsed = this.schema.safeParse(value)
		if (parsed.success) return parsed.data

		throw new ApiException(
			HttpStatus.BAD_REQUEST,
			'VALIDATION_FAILED',
			'The request is invalid',
			parsed.error.issues.map((issue) => ({
				path: issue.path.join('.'),
				message: issue.message,
			}))
		)
	}
}
