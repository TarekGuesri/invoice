import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { SYSTEM_QUEUE } from './heartbeat.constants'
import { HeartbeatProcessor } from './heartbeat.processor'
import { HeartbeatScheduler } from './heartbeat.scheduler'

@Module({
	imports: [
		BullModule.registerQueue({
			name: SYSTEM_QUEUE,
			// Redis Cloud's free tier has 30 MB, so finished jobs are trimmed.
			defaultJobOptions: {
				removeOnComplete: { count: 10 },
				removeOnFail: { count: 50 },
			},
		}),
	],
	providers: [HeartbeatProcessor, HeartbeatScheduler],
})
export class HeartbeatModule {}
