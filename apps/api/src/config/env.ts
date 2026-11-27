import { z } from 'zod'

/** Treats `KEY=` (empty) the same as an unset variable. */
function optional<T extends z.ZodType>(schema: T) {
	return z.preprocess(
		(value) => (value === '' ? undefined : value),
		schema.optional()
	)
}

const port = z.coerce.number().int().min(0).max(65535)

const DURATION_UNITS_SECONDS = { s: 1, m: 60, h: 3_600, d: 86_400 } as const

/** Parses durations like `15m` or `7d` into seconds. */
const durationSeconds = z
	.string()
	.regex(/^\d+(s|m|h|d)$/, 'Use a number followed by s, m, h or d (e.g. 15m)')
	.transform((value) => {
		const unit = value.slice(-1) as keyof typeof DURATION_UNITS_SECONDS
		return Number(value.slice(0, -1)) * DURATION_UNITS_SECONDS[unit]
	})

/** Variables shared by the API and the worker. */
export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	/** Injected by Cloud Run. Takes precedence over API_PORT when present. */
	PORT: optional(port),
	API_PORT: port.default(4000),
	WEB_ORIGIN: z.url(),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
	REDIS_URL: z.url({ protocol: /^rediss?$/ }),
	LOG_LEVEL: z
		.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
		.default('info'),
	/** Git SHA baked into the Docker image at build time. */
	APP_VERSION: z.string().min(1).default('dev'),
	SENTRY_DSN: optional(z.url()),
})

/** The worker never handles auth, so it doesn't get the JWT secret. */
export const apiEnvSchema = envSchema.extend({
	JWT_ACCESS_SECRET: z
		.string()
		.min(32, 'Use at least 32 characters (e.g. `openssl rand -base64 48`)'),
	JWT_ACCESS_TTL: durationSeconds.default(15 * 60),
	JWT_REFRESH_TTL: durationSeconds.default(7 * 86_400),
})

export type Env = z.infer<typeof envSchema>
export type ApiEnv = z.infer<typeof apiEnvSchema>

export function validateEnv(config: Record<string, unknown>): Env {
	return parseEnv(envSchema, config)
}

export function validateApiEnv(config: Record<string, unknown>): ApiEnv {
	return parseEnv(apiEnvSchema, config)
}

function parseEnv<T extends z.ZodType>(
	schema: T,
	config: Record<string, unknown>
): z.output<T> {
	const parsed = schema.safeParse(config)

	if (parsed.success) return parsed.data

	const issues = parsed.error.issues
		.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
		.join('\n')
	throw new Error(`Invalid environment variables:\n${issues}`)
}
