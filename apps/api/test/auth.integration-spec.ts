import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import {
	ApiErrorResponseSchema,
	AuthResponseSchema,
	MeResponseSchema,
} from '@repo/shared'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { REFRESH_REUSE_GRACE_MS } from '../src/modules/auth/auth.service'
import { PrismaService } from '../src/modules/prisma/prisma.service'

const PASSWORD = 'correct horse battery'

/** `name=value` pairs from Set-Cookie, ready to send back as `Cookie`. */
function cookiesFrom(res: request.Response) {
	const header = res.headers['set-cookie'] as unknown as string[] | undefined
	return (header ?? []).map((cookie) => cookie.slice(0, cookie.indexOf(';')))
}

function findCookie(res: request.Response, name: string) {
	const header = res.headers['set-cookie'] as unknown as string[] | undefined
	return header?.find((cookie) => cookie.startsWith(`${name}=`))
}

function cookieAttributes(res: request.Response, name: string) {
	return findCookie(res, name)?.split('; ').slice(1)
}

/** Runs against the real Postgres and Redis from docker-compose / CI. */
describe('Auth (integration)', () => {
	let app: INestApplication<App>
	let prisma: PrismaService

	const http = () => request(app.getHttpServer())
	const uniqueEmail = () => `user-${randomUUID()}@example.com`

	async function register(email = uniqueEmail()) {
		const res = await http()
			.post('/api/v1/auth/register')
			.send({ email, password: PASSWORD })
			.expect(201)
		return { email, res, cookies: cookiesFrom(res) }
	}

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		configureApp(app, app.get(ConfigService))
		await app.init()
		prisma = app.get(PrismaService)
	})

	afterAll(async () => {
		await prisma.user.deleteMany({
			where: { email: { endsWith: '@example.com' } },
		})
		await app.close()
	})

	describe('register', () => {
		it('creates the account, logs in and sets httpOnly cookies', async () => {
			const { email, res } = await register()

			expect(AuthResponseSchema.parse(res.body).user).toMatchObject({
				email,
				role: 'USER',
			})
			expect(cookieAttributes(res, 'access_token')).toEqual(
				expect.arrayContaining(['Path=/', 'HttpOnly', 'SameSite=Lax'])
			)
			expect(cookieAttributes(res, 'refresh_token')).toEqual(
				expect.arrayContaining([
					'Path=/api/v1/auth',
					'HttpOnly',
					'SameSite=Lax',
				])
			)
		})

		it('normalizes the email and stores only an argon2 hash', async () => {
			const email = uniqueEmail()
			await register(`  ${email.toUpperCase()} `)

			const user = await prisma.user.findUniqueOrThrow({
				where: { email },
			})
			expect(user.passwordHash).toMatch(/^\$argon2id\$/)
		})

		it('rejects an email that is already registered', async () => {
			const { email } = await register()

			const res = await http()
				.post('/api/v1/auth/register')
				.send({ email: email.toUpperCase(), password: PASSWORD })
				.expect(409)

			expect(ApiErrorResponseSchema.parse(res.body).error.code).toBe(
				'EMAIL_TAKEN'
			)
		})

		it('returns field-level validation errors', async () => {
			const res = await http()
				.post('/api/v1/auth/register')
				.send({ email: 'nope', password: 'short' })
				.expect(400)

			const { error } = ApiErrorResponseSchema.parse(res.body)
			expect(error.code).toBe('VALIDATION_FAILED')
			expect(error.details?.map((issue) => issue.path)).toEqual([
				'email',
				'password',
			])
		})
	})

	describe('login', () => {
		it('logs in with the right password', async () => {
			const { email } = await register()

			const res = await http()
				.post('/api/v1/auth/login')
				.send({ email, password: PASSWORD })
				.expect(200)

			expect(AuthResponseSchema.parse(res.body).user.email).toBe(email)
			expect(findCookie(res, 'access_token')).toBeDefined()
		})

		it('gives the same error for a wrong password and an unknown email', async () => {
			const { email } = await register()

			const wrongPassword = await http()
				.post('/api/v1/auth/login')
				.send({ email, password: 'wrong password!' })
				.expect(401)
			const unknownEmail = await http()
				.post('/api/v1/auth/login')
				.send({ email: uniqueEmail(), password: PASSWORD })
				.expect(401)

			expect(wrongPassword.body).toEqual(unknownEmail.body)
			expect(
				ApiErrorResponseSchema.parse(wrongPassword.body).error.code
			).toBe('INVALID_CREDENTIALS')
			expect(findCookie(wrongPassword, 'access_token')).toBeUndefined()
		})
	})

	describe('GET /me', () => {
		it('returns the current user', async () => {
			const { email, cookies } = await register()

			const res = await http()
				.get('/api/v1/me')
				.set('Cookie', cookies)
				.expect(200)

			expect(MeResponseSchema.parse(res.body).user.email).toBe(email)
		})

		it('rejects requests without a valid access token', async () => {
			await http().get('/api/v1/me').expect(401)
			const res = await http()
				.get('/api/v1/me')
				.set('Cookie', 'access_token=not-a-jwt')
				.expect(401)

			expect(ApiErrorResponseSchema.parse(res.body).error.code).toBe(
				'UNAUTHORIZED'
			)
		})

		it('rejects the access token of a deleted account', async () => {
			const { email, cookies } = await register()
			await prisma.user.delete({ where: { email } })

			await http().get('/api/v1/me').set('Cookie', cookies).expect(401)
		})
	})

	describe('refresh', () => {
		it('rotates the refresh token', async () => {
			const { cookies } = await register()

			const res = await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', cookies)
				.expect(200)

			const rotated = cookiesFrom(res)
			expect(rotated).toHaveLength(2)
			expect(rotated).not.toEqual(cookies)
			await http().get('/api/v1/me').set('Cookie', rotated).expect(200)
		})

		it('rejects a token that was just rotated, without logging out', async () => {
			const { cookies } = await register()
			const rotated = cookiesFrom(
				await http()
					.post('/api/v1/auth/refresh')
					.set('Cookie', cookies)
					.expect(200)
			)

			await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', cookies)
				.expect(401)

			// Inside the grace window the newer session survives.
			await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', rotated)
				.expect(200)
		})

		it('revokes every session when an old token is reused', async () => {
			const { email, cookies } = await register()
			const rotated = cookiesFrom(
				await http()
					.post('/api/v1/auth/refresh')
					.set('Cookie', cookies)
					.expect(200)
			)
			// Pretend the first token was rotated long ago.
			await prisma.refreshToken.updateMany({
				where: { user: { email }, revokedAt: { not: null } },
				data: {
					revokedAt: new Date(
						Date.now() - REFRESH_REUSE_GRACE_MS - 1_000
					),
				},
			})

			await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', cookies)
				.expect(401)

			await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', rotated)
				.expect(401)
		})

		it('rejects an expired refresh token and clears the cookies', async () => {
			const { email, cookies } = await register()
			await prisma.refreshToken.updateMany({
				where: { user: { email } },
				data: { expiresAt: new Date(Date.now() - 1_000) },
			})

			const res = await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', cookies)
				.expect(401)

			expect(findCookie(res, 'refresh_token')).toMatch(
				/Expires=Thu, 01 Jan 1970/
			)
		})

		it('rejects a request without a refresh token', async () => {
			await http().post('/api/v1/auth/refresh').expect(401)
		})
	})

	describe('logout', () => {
		it('revokes the refresh token and clears both cookies', async () => {
			const { cookies } = await register()

			const res = await http()
				.post('/api/v1/auth/logout')
				.set('Cookie', cookies)
				.expect(204)

			expect(findCookie(res, 'access_token')).toMatch(
				/Expires=Thu, 01 Jan 1970/
			)
			expect(findCookie(res, 'refresh_token')).toMatch(
				/Expires=Thu, 01 Jan 1970/
			)
			await http()
				.post('/api/v1/auth/refresh')
				.set('Cookie', cookies)
				.expect(401)
		})

		it('succeeds without a session', async () => {
			await http().post('/api/v1/auth/logout').expect(204)
		})
	})

	describe('CSRF origin check', () => {
		it('rejects a mutating request from another origin', async () => {
			const res = await http()
				.post('/api/v1/auth/login')
				.set('Origin', 'https://evil.example')
				.send({ email: uniqueEmail(), password: PASSWORD })
				.expect(403)

			expect(ApiErrorResponseSchema.parse(res.body).error.code).toBe(
				'FORBIDDEN_ORIGIN'
			)
		})

		it('accepts the configured web origin', async () => {
			await http()
				.post('/api/v1/auth/register')
				.set('Origin', app.get(ConfigService).getOrThrow('WEB_ORIGIN'))
				.send({ email: uniqueEmail(), password: PASSWORD })
				.expect(201)
		})
	})
})
