import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'

import type { Env } from '../../config/env'
import { REDIS_CLIENT } from './redis.constants'

/**
 * A plain ioredis client for app-level keys (health, heartbeat). BullMQ
 * manages its own connections.
 */
@Global()
@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			inject: [ConfigService],
			useFactory: (config: ConfigService<Env, true>) =>
				new Redis(config.get('REDIS_URL', { infer: true }), {
					lazyConnect: true,
					connectTimeout: 5_000,
					maxRetriesPerRequest: 2,
				}),
		},
	],
	exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

	async onModuleDestroy() {
		if (this.redis.status === 'wait' || this.redis.status === 'end') return
		await this.redis.quit()
	}
}
