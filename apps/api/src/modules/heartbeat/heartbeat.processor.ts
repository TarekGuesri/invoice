import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import * as Sentry from '@sentry/nestjs'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'

import { REDIS_CLIENT } from '../redis/redis.constants'
import {
	HEARTBEAT_JOB,
	HEARTBEAT_KEY,
	SYSTEM_QUEUE,
} from './heartbeat.constants'

/**
 * A no-op job that proves the worker is alive end to end: it is scheduled in
 * Redis, picked up by this process, and leaves a timestamp the API's health
 * endpoint reports.
 */
@Processor(SYSTEM_QUEUE)
export class HeartbeatProcessor extends WorkerHost {
	private readonly logger = new Logger(HeartbeatProcessor.name)

	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
		super()
	}

	async process(job: Job) {
		if (job.name !== HEARTBEAT_JOB) {
			throw new Error(`Unknown job "${job.name}" on ${SYSTEM_QUEUE}`)
		}

		const beatAt = new Date().toISOString()
		await this.redis.set(HEARTBEAT_KEY, beatAt)
		this.logger.debug(`Heartbeat ${beatAt}`)
		return { beatAt }
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job | undefined, error: Error) {
		this.logger.error(
			`Job ${job?.name ?? 'unknown'} failed: ${error.message}`
		)
		Sentry.captureException(error)
	}
}
