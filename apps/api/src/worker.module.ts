import { Module } from '@nestjs/common'

import { AppLoggerModule } from './common/logger/logger.module'
import { AppConfigModule } from './config/app-config.module'
import { HeartbeatModule } from './modules/heartbeat/heartbeat.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { QueueModule } from './modules/queue/queue.module'
import { RedisModule } from './modules/redis/redis.module'

/** Root module for the worker: queues and processors, no HTTP server. */
@Module({
	imports: [
		AppConfigModule,
		AppLoggerModule,
		PrismaModule,
		RedisModule,
		QueueModule,
		HeartbeatModule,
	],
})
export class WorkerModule {}
