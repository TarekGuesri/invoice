import {
	CanActivate,
	ExecutionContext,
	HttpStatus,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { ApiException } from '../../common/errors/api-exception'
import { ACCESS_COOKIE, readCookie } from './auth-cookies'
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types'
import { IS_PUBLIC_KEY } from './public.decorator'

/**
 * Global guard: every route needs a valid access-token cookie unless it is
 * marked `@Public()`. The client answers a 401 by calling `/auth/refresh`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwt: JwtService
	) {}

	async canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()]
		)
		if (isPublic) return true

		const req = context.switchToHttp().getRequest<AuthenticatedRequest>()
		const token = readCookie(req, ACCESS_COOKIE)
		if (!token) throw unauthorized()

		try {
			const payload =
				await this.jwt.verifyAsync<AccessTokenPayload>(token)
			req.user = { id: payload.sub, role: payload.role }
			return true
		} catch {
			throw unauthorized()
		}
	}
}

function unauthorized() {
	return new ApiException(
		HttpStatus.UNAUTHORIZED,
		'UNAUTHORIZED',
		'You need to log in'
	)
}
