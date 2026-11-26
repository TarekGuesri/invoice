import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { DependencyCheck, HealthResponse, WorkerCheck } from '@repo/shared'
import { Redis } from 'ioredis'

import { withTimeout } from '../../common/lib/with-timeout'
import type { Env } from '../../config/env'
import {
	HEARTBEAT_KEY,
	HEARTBEAT_STALE_AFTER_MS,
} from '../heartbeat/heartbeat.constants'
import { PrismaService } from '../prisma/prisma.service'
import { REDIS_CLIENT } from '../redis/redis.constants'

/** Neon may need a moment to resume a suspended compute. */
const DATABASE_TIMEOUT_MS = 5_000
const REDIS_TIMEOUT_MS = 2_000

@Injectable()
export class HealthService {
	private readonly logger = new Logger(HealthService.name)
	private readonly version: string

	constructor(
		private readonly prisma: PrismaService,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
		config: ConfigService<Env, true>
	) {
		this.version = config.get('APP_VERSION', { infer: true })
	}

	async check(): Promise<HealthResponse> {
		const [database, redis, worker] = await Promise.all([
			this.probe(
				'database',
				DATABASE_TIMEOUT_MS,
				() => this.prisma.$queryRaw`SELECT 1`
			),
			this.probe('redis', REDIS_TIMEOUT_MS, () => this.redis.ping()),
			this.checkWorker(),
		])

		return {
			status:
				database.status === 'up' && redis.status === 'up'
					? 'ok'
					: 'error',
			version: this.version,
			uptimeSeconds: Math.round(process.uptime()),
			checks: { database, redis, worker },
		}
	}

	private async probe(
		name: string,
		timeoutMs: number,
		run: () => Promise<unknown>
	): Promise<DependencyCheck> {
		const startedAt = performance.now()
		try {
			await withTimeout(run(), timeoutMs)
			return {
				status: 'up',
				latencyMs: Math.round(performance.now() - startedAt),
			}
		} catch (error) {
			this.logger.warn(
				`Health check "${name}" failed: ${error instanceof Error ? error.message : String(error)}`
			)
			return { status: 'down', latencyMs: null }
		}
	}

	/** Informational only: a stale worker doesn't make the API unhealthy. */
	private async checkWorker(): Promise<WorkerCheck> {
		let lastHeartbeatAt: string | null = null
		try {
			lastHeartbeatAt = await withTimeout(
				this.redis.get(HEARTBEAT_KEY),
				REDIS_TIMEOUT_MS
			)
		} catch {
			return { status: 'unknown', lastHeartbeatAt: null }
		}

		if (!lastHeartbeatAt) return { status: 'unknown', lastHeartbeatAt }

		const ageMs = Date.now() - new Date(lastHeartbeatAt).getTime()
		return {
			status: ageMs <= HEARTBEAT_STALE_AFTER_MS ? 'up' : 'stale',
			lastHeartbeatAt,
		}
	}
}
