import {
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import type { ApiErrorResponse, ErrorCode } from '@repo/shared'
import { SentryExceptionCaptured } from '@sentry/nestjs'
import type { Response } from 'express'

import { ApiException } from '../errors/api-exception'

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
	[HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
	[HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
	[HttpStatus.FORBIDDEN]: 'FORBIDDEN',
	[HttpStatus.NOT_FOUND]: 'NOT_FOUND',
	[HttpStatus.CONFLICT]: 'CONFLICT',
	[HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
}

/**
 * Gives every error response the shared `ApiErrorResponse` shape. Unexpected
 * errors are logged, reported to Sentry, and hidden behind a generic message.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name)

	@SentryExceptionCaptured()
	catch(exception: unknown, host: ArgumentsHost) {
		const res = host.switchToHttp().getResponse<Response>()
		const { status, body } = this.toResponse(exception)

		if (status >= 500) {
			this.logger.error(
				exception instanceof Error ? exception.stack : exception
			)
		}

		res.status(status).json(body)
	}

	private toResponse(exception: unknown): {
		status: number
		body: ApiErrorResponse
	} {
		if (exception instanceof ApiException) {
			return {
				status: exception.getStatus(),
				body: {
					error: {
						code: exception.code,
						message: exception.message,
						details: exception.details,
					},
				},
			}
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus()
			const code =
				CODE_BY_STATUS[status] ??
				(status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST')
			return {
				status,
				body: { error: { code, message: exception.message } },
			}
		}

		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			body: {
				error: {
					code: 'INTERNAL_ERROR',
					message: 'Something went wrong on our side',
				},
			},
		}
	}
}
