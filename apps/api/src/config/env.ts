import { z } from 'zod'

/** Treats `KEY=` (empty) the same as an unset variable. */
function optional<T extends z.ZodType>(schema: T) {
	return z.preprocess(
		(value) => (value === '' ? undefined : value),
		schema.optional()
	)
}

const port = z.coerce.number().int().min(0).max(65535)

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

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
	const parsed = envSchema.safeParse(config)

	if (parsed.success) return parsed.data

	const issues = parsed.error.issues
		.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
		.join('\n')
	throw new Error(`Invalid environment variables:\n${issues}`)
}
