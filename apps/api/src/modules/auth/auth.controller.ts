import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { LoginRequestSchema, RegisterRequestSchema } from '@repo/shared'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@repo/shared'
import type { Request, Response } from 'express'

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { AuthCookies, REFRESH_COOKIE, readCookie } from './auth-cookies'
import { AUTH_THROTTLE } from './auth.constants'
import { AuthService, Session, toUserDto } from './auth.service'
import { Public } from './public.decorator'

@Public()
@Throttle({ default: AUTH_THROTTLE })
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly cookies: AuthCookies
	) {}

	@Post('register')
	async register(
		@Body(new ZodValidationPipe(RegisterRequestSchema))
		body: RegisterRequest,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		return this.startSession(res, await this.authService.register(body))
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		return this.startSession(res, await this.authService.login(body))
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	): Promise<AuthResponse> {
		try {
			const session = await this.authService.refresh(
				readCookie(req, REFRESH_COOKIE)
			)
			return this.startSession(res, session)
		} catch (error) {
			// Leave the browser with no stale cookies to retry with.
			this.cookies.clear(res)
			throw error
		}
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		await this.authService.logout(readCookie(req, REFRESH_COOKIE))
		this.cookies.clear(res)
	}

	private startSession(res: Response, session: Session): AuthResponse {
		this.cookies.set(res, session)
		return { user: toUserDto(session.user) }
	}
}
