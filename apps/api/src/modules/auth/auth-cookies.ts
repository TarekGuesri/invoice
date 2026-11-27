import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { CookieOptions, Request, Response } from 'express'

import type { ApiEnv } from '../../config/env'
import { API_PREFIX } from '../../configure-app'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'
/** The refresh token is only ever sent to the auth routes. */
const REFRESH_COOKIE_PATH = `/${API_PREFIX}/auth`

export function readCookie(req: Request, name: string): string | undefined {
	// cookie-parser fills `req.cookies`; it's typed loosely.
	const cookies = req.cookies as Record<string, unknown> | undefined
	const value = cookies?.[name]
	return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Tokens travel only in httpOnly cookies, so page scripts can't read them.
 * `sameSite=lax` works because the web app and the API share a site (§4.1).
 */
@Injectable()
export class AuthCookies {
	private readonly secure: boolean
	private readonly accessTtlMs: number
	private readonly refreshTtlMs: number

	constructor(config: ConfigService<ApiEnv, true>) {
		this.secure = config.get('NODE_ENV', { infer: true }) === 'production'
		this.accessTtlMs = config.get('JWT_ACCESS_TTL', { infer: true }) * 1000
		this.refreshTtlMs =
			config.get('JWT_REFRESH_TTL', { infer: true }) * 1000
	}

	set(res: Response, tokens: { accessToken: string; refreshToken: string }) {
		res.cookie(ACCESS_COOKIE, tokens.accessToken, {
			...this.base('/'),
			maxAge: this.accessTtlMs,
		})
		res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
			...this.base(REFRESH_COOKIE_PATH),
			maxAge: this.refreshTtlMs,
		})
	}

	clear(res: Response) {
		res.clearCookie(ACCESS_COOKIE, this.base('/'))
		res.clearCookie(REFRESH_COOKIE, this.base(REFRESH_COOKIE_PATH))
	}

	private base(path: string): CookieOptions {
		return { httpOnly: true, secure: this.secure, sameSite: 'lax', path }
	}
}
