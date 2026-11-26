import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { RedisOptions } from 'bullmq'

import type { Env } from '../../config/env'

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<Env, true>) => {
				const connection: RedisOptions = {
					url: config.get('REDIS_URL', { infer: true }),
					// Required by BullMQ workers: blocking commands must not
					// give up while Redis reconnects.
					maxRetriesPerRequest: null,
				}
				return { connection }
			},
		}),
	],
})
export class QueueModule {}
