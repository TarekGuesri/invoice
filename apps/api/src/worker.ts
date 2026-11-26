import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import './instrument'
import { WorkerModule } from './worker.module'

/**
 * Same image as the API, different command (`node dist/worker.js`). On
 * SIGTERM, Nest closes the BullMQ workers, which wait for in-flight jobs.
 */
async function bootstrap() {
	const app = await NestFactory.createApplicationContext(WorkerModule, {
		bufferLogs: true,
	})
	const logger = app.get(Logger)

	app.useLogger(logger)
	app.enableShutdownHooks()
	logger.log('Worker started')
}

void bootstrap()
