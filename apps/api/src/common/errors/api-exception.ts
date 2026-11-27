import { HttpException, HttpStatus } from '@nestjs/common'
import type { ErrorCode, ValidationIssue } from '@repo/shared'

/**
 * An HTTP error with a code from the shared `ErrorCode` list. The global
 * exception filter turns it into `{ error: { code, message, details? } }`.
 */
export class ApiException extends HttpException {
	constructor(
		status: HttpStatus,
		readonly code: ErrorCode,
		message: string,
		readonly details?: ValidationIssue[]
	) {
		super(message, status)
	}
}
