import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Queue } from 'bullmq'

import {
	HEARTBEAT_INTERVAL_MS,
	HEARTBEAT_JOB,
	SYSTEM_QUEUE,
} from './heartbeat.constants'

@Injectable()
export class HeartbeatScheduler implements OnApplicationBootstrap {
	private readonly logger = new Logger(HeartbeatScheduler.name)

	constructor(@InjectQueue(SYSTEM_QUEUE) private readonly queue: Queue) {}

	/**
	 * Upserting is idempotent, so restarts and redeploys never duplicate it.
	 * With `every`, BullMQ runs the first beat immediately.
	 */
	async onApplicationBootstrap() {
		await this.queue.upsertJobScheduler(
			HEARTBEAT_JOB,
			{ every: HEARTBEAT_INTERVAL_MS },
			{ name: HEARTBEAT_JOB }
		)
		this.logger.log(
			`Heartbeat scheduled every ${HEARTBEAT_INTERVAL_MS / 1000}s`
		)
	}
}
