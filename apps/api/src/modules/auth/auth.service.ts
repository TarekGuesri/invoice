import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Prisma } from '@repo/db'
import type { User as UserRecord } from '@repo/db'
import type { LoginRequest, RegisterRequest, User } from '@repo/shared'
import argon2 from 'argon2'
import { createHash, randomBytes } from 'node:crypto'

import { ApiException } from '../../common/errors/api-exception'
import type { ApiEnv } from '../../config/env'
import { PrismaService } from '../prisma/prisma.service'
import type { AccessTokenPayload } from './auth.types'

/**
 * Two tabs can refresh with the same token at once. A token reused within
 * this window is just rejected; reused later, it's treated as stolen and
 * every session of that user is revoked.
 */
export const REFRESH_REUSE_GRACE_MS = 10_000

export interface Session {
	user: UserRecord
	accessToken: string
	refreshToken: string
}

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)
	private readonly refreshTtlMs: number
	/** Hashed once, lazily, so unknown emails cost as much as wrong passwords. */
	private dummyHash?: Promise<string>

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		config: ConfigService<ApiEnv, true>
	) {
		this.refreshTtlMs =
			config.get('JWT_REFRESH_TTL', { infer: true }) * 1000
	}

	async register({ email, password }: RegisterRequest): Promise<Session> {
		const passwordHash = await argon2.hash(password)

		try {
			const user = await this.prisma.user.create({
				data: { email, passwordHash },
			})
			return await this.createSession(user)
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			) {
				throw new ApiException(
					HttpStatus.CONFLICT,
					'EMAIL_TAKEN',
					'An account with this email already exists'
				)
			}
			throw error
		}
	}

	async login({ email, password }: LoginRequest): Promise<Session> {
		const user = await this.prisma.user.findUnique({ where: { email } })

		if (!user) {
			this.dummyHash ??= argon2.hash(randomBytes(16).toString('hex'))
			await argon2.verify(await this.dummyHash, password)
			throw invalidCredentials()
		}
		if (!(await argon2.verify(user.passwordHash, password))) {
			throw invalidCredentials()
		}

		return this.createSession(user)
	}

	/** Rotates the refresh token: the presented one is revoked either way. */
	async refresh(rawToken: string | undefined): Promise<Session> {
		if (!rawToken) throw sessionExpired()

		const token = await this.prisma.refreshToken.findUnique({
			where: { tokenHash: hashToken(rawToken) },
			include: { user: true },
		})
		if (!token) throw sessionExpired()

		const now = new Date()
		if (token.revokedAt) {
			await this.handleReuse(token.userId, token.revokedAt, now)
			throw sessionExpired()
		}
		if (token.expiresAt <= now) throw sessionExpired()

		// Compare-and-set, so two concurrent refreshes can't both succeed.
		const { count } = await this.prisma.refreshToken.updateMany({
			where: { id: token.id, revokedAt: null },
			data: { revokedAt: now },
		})
		if (count === 0) throw sessionExpired()

		return this.createSession(token.user)
	}

	async logout(rawToken: string | undefined) {
		if (!rawToken) return

		await this.prisma.refreshToken.updateMany({
			where: { tokenHash: hashToken(rawToken), revokedAt: null },
			data: { revokedAt: new Date() },
		})
	}

	findUser(id: string) {
		return this.prisma.user.findUnique({ where: { id } })
	}

	private async createSession(user: UserRecord): Promise<Session> {
		const refreshToken = randomBytes(32).toString('base64url')
		const now = Date.now()

		await this.prisma.$transaction([
			// Housekeeping: a user's expired tokens are useless.
			this.prisma.refreshToken.deleteMany({
				where: { userId: user.id, expiresAt: { lte: new Date(now) } },
			}),
			this.prisma.refreshToken.create({
				data: {
					userId: user.id,
					tokenHash: hashToken(refreshToken),
					expiresAt: new Date(now + this.refreshTtlMs),
				},
			}),
		])

		const payload: AccessTokenPayload = { sub: user.id, role: user.role }
		const accessToken = await this.jwt.signAsync(payload)

		return { user, accessToken, refreshToken }
	}

	private async handleReuse(userId: string, revokedAt: Date, now: Date) {
		if (now.getTime() - revokedAt.getTime() <= REFRESH_REUSE_GRACE_MS) {
			return
		}

		this.logger.warn(
			`Revoked refresh token reused for user ${userId}; revoking all sessions`
		)
		await this.prisma.refreshToken.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: now },
		})
	}
}

export function toUserDto(user: UserRecord): User {
	return {
		id: user.id,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt.toISOString(),
	}
}

/** Refresh tokens are 256 random bits, so a fast hash is enough. */
function hashToken(rawToken: string) {
	return createHash('sha256').update(rawToken).digest('hex')
}

function invalidCredentials() {
	return new ApiException(
		HttpStatus.UNAUTHORIZED,
		'INVALID_CREDENTIALS',
		'Incorrect email or password'
	)
}

function sessionExpired() {
	return new ApiException(
		HttpStatus.UNAUTHORIZED,
		'UNAUTHORIZED',
		'Your session has expired. Please log in again.'
	)
}
