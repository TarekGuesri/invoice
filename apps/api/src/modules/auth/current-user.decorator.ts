import { ExecutionContext, createParamDecorator } from '@nestjs/common'

import type { AuthUser, AuthenticatedRequest } from './auth.types'

/** The caller set by `JwtAuthGuard`. Only valid on non-public routes. */
export const CurrentUser = createParamDecorator(
	(_data: unknown, context: ExecutionContext): AuthUser =>
		context.switchToHttp().getRequest<AuthenticatedRequest>().user
)
