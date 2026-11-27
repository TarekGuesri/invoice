import { validateApiEnv, validateEnv } from './env'

const validEnv = {
	WEB_ORIGIN: 'http://localhost:3000',
	DATABASE_URL: 'postgresql://invoice:invoice@localhost:5432/invoice',
	REDIS_URL: 'redis://localhost:6379',
}

describe('validateEnv', () => {
	it('applies defaults to a minimal valid env', () => {
		const env = validateEnv(validEnv)

		expect(env.NODE_ENV).toBe('development')
		expect(env.API_PORT).toBe(4000)
		expect(env.PORT).toBeUndefined()
		expect(env.APP_VERSION).toBe('dev')
		expect(env.LOG_LEVEL).toBe('info')
	})

	it('coerces ports from strings', () => {
		const env = validateEnv({ ...validEnv, PORT: '8080', API_PORT: '5000' })

		expect(env.PORT).toBe(8080)
		expect(env.API_PORT).toBe(5000)
	})

	it('treats empty optional values as unset', () => {
		const env = validateEnv({ ...validEnv, SENTRY_DSN: '', PORT: '' })

		expect(env.SENTRY_DSN).toBeUndefined()
		expect(env.PORT).toBeUndefined()
	})

	it('accepts TLS Redis URLs', () => {
		const env = validateEnv({
			...validEnv,
			REDIS_URL: 'rediss://default:secret@redis.example.com:6380',
		})

		expect(env.REDIS_URL).toMatch(/^rediss:/)
	})

	it('rejects a database URL with the wrong protocol', () => {
		expect(() =>
			validateEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/db' })
		).toThrow(/DATABASE_URL/)
	})

	it('lists every missing variable in one error', () => {
		expect(() => validateEnv({})).toThrow(
			/WEB_ORIGIN[\s\S]*DATABASE_URL[\s\S]*REDIS_URL/
		)
	})
})

describe('validateApiEnv', () => {
	const validApiEnv = {
		...validEnv,
		JWT_ACCESS_SECRET: 'a'.repeat(32),
	}

	it('defaults the token lifetimes to 15 minutes and 7 days', () => {
		const env = validateApiEnv(validApiEnv)

		expect(env.JWT_ACCESS_TTL).toBe(15 * 60)
		expect(env.JWT_REFRESH_TTL).toBe(7 * 86_400)
	})

	it('parses durations into seconds', () => {
		const env = validateApiEnv({
			...validApiEnv,
			JWT_ACCESS_TTL: '30s',
			JWT_REFRESH_TTL: '12h',
		})

		expect(env.JWT_ACCESS_TTL).toBe(30)
		expect(env.JWT_REFRESH_TTL).toBe(12 * 3_600)
	})

	it('rejects durations without a unit', () => {
		expect(() =>
			validateApiEnv({ ...validApiEnv, JWT_ACCESS_TTL: '900' })
		).toThrow(/JWT_ACCESS_TTL/)
	})

	it('rejects a short JWT secret', () => {
		expect(() =>
			validateApiEnv({ ...validEnv, JWT_ACCESS_SECRET: 'change-me' })
		).toThrow(/JWT_ACCESS_SECRET/)
	})

	it('is not required by the worker', () => {
		expect(() => validateEnv(validEnv)).not.toThrow()
	})
})
