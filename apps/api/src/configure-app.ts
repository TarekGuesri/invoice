import type { INestApplication } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'

import type { Env } from './config/env'

export const API_PREFIX = 'api/v1'

/** Shared by main.ts and the integration tests so both see the same app. */
export function configureApp(
	app: INestApplication,
	config: ConfigService<Env, true>
) {
	app.setGlobalPrefix(API_PREFIX)
	app.use(cookieParser())
	app.enableCors({
		origin: config.get('WEB_ORIGIN', { infer: true }),
		credentials: true,
	})
}
