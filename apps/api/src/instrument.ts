import * as Sentry from '@sentry/nestjs'

// Imported first by both entrypoints so Sentry can hook into modules before
// they load. Without a DSN (local dev, CI) Sentry stays disabled.
const dsn = process.env.SENTRY_DSN

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV,
		release: process.env.APP_VERSION,
		tracesSampleRate: 0,
	})
}
