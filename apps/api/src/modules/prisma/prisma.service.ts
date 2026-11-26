import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient, createPrismaClientOptions } from '@repo/db'

import type { Env } from '../../config/env'

/**
 * Prisma connects lazily on the first query, so API cold starts don't wait
 * for Neon to wake up.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
	constructor(config: ConfigService<Env, true>) {
		super(
			createPrismaClientOptions(
				config.get('DATABASE_URL', { infer: true })
			)
		)
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
