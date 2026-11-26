import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'
import type { Env } from './config/env'
import { configureApp } from './configure-app'
import './instrument'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	})
	const logger = app.get(Logger)
	const config = app.get<ConfigService<Env, true>>(ConfigService)

	app.useLogger(logger)
	app.use(helmet())
	// Cloud Run terminates TLS in front of the container.
	app.set('trust proxy', 1)
	configureApp(app, config)
	app.enableShutdownHooks()

	const port =
		config.get('PORT', { infer: true }) ??
		config.get('API_PORT', { infer: true })
	await app.listen(port, '0.0.0.0')
	logger.log(`API listening on port ${port}`)
}

void bootstrap()
