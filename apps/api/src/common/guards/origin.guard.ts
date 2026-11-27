import {
	CanActivate,
	ExecutionContext,
	HttpStatus,
	Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'

import type { Env } from '../../config/env'
import { ApiException } from '../errors/api-exception'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF defense on top of `sameSite=lax` cookies: browsers always send
 * `Origin` on cross-site and same-site POSTs, so a mutating request from any
 * origin other than the web app is rejected. Requests without `Origin` come
 * from non-browser clients (curl, server-to-server), which can't ride on a
 * visitor's cookies.
 */
@Injectable()
export class OriginGuard implements CanActivate {
	private readonly webOrigin: string

	constructor(config: ConfigService<Env, true>) {
		this.webOrigin = new URL(
			config.get('WEB_ORIGIN', { infer: true })
		).origin
	}

	canActivate(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest<Request>()
		const origin = req.headers.origin

		if (SAFE_METHODS.has(req.method) || origin === undefined) return true
		if (origin === this.webOrigin) return true

		throw new ApiException(
			HttpStatus.FORBIDDEN,
			'FORBIDDEN_ORIGIN',
			'Requests from this origin are not allowed'
		)
	}
}
