import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HealthResponseSchema } from '@repo/shared'
import type { Redis } from 'ioredis'

import { HEARTBEAT_STALE_AFTER_MS } from '../heartbeat/heartbeat.constants'
import type { PrismaService } from '../prisma/prisma.service'
import { HealthService } from './health.service'

function createService({
	queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]),
	ping = jest.fn().mockResolvedValue('PONG'),
	get = jest.fn().mockResolvedValue(null),
} = {}) {
	const prisma = { $queryRaw: queryRaw } as unknown as PrismaService
	const redis = { ping, get } as unknown as Redis
	const config = new ConfigService({ APP_VERSION: 'abc123' })
	return new HealthService(prisma, redis, config as never)
}

describe('HealthService', () => {
	beforeAll(() => {
		Logger.overrideLogger(false)
	})

	it('reports ok when the database and Redis respond', async () => {
		const health = await createService().check()

		expect(HealthResponseSchema.parse(health)).toEqual(health)
		expect(health.status).toBe('ok')
		expect(health.version).toBe('abc123')
		expect(health.checks.database.status).toBe('up')
		expect(health.checks.redis.status).toBe('up')
	})

	it('reports error when the database is down', async () => {
		const health = await createService({
			queryRaw: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
		}).check()

		expect(health.status).toBe('error')
		expect(health.checks.database).toEqual({
			status: 'down',
			latencyMs: null,
		})
	})

	it('reports error when Redis is down', async () => {
		const health = await createService({
			ping: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
		}).check()

		expect(health.status).toBe('error')
		expect(health.checks.redis.status).toBe('down')
	})

	it('reports the worker as unknown before its first heartbeat', async () => {
		const health = await createService().check()

		expect(health.checks.worker).toEqual({
			status: 'unknown',
			lastHeartbeatAt: null,
		})
	})

	it('reports the worker as up after a recent heartbeat', async () => {
		const lastHeartbeatAt = new Date().toISOString()
		const health = await createService({
			get: jest.fn().mockResolvedValue(lastHeartbeatAt),
		}).check()

		expect(health.checks.worker).toEqual({ status: 'up', lastHeartbeatAt })
	})

	it('reports a stale worker without failing the API health', async () => {
		const lastHeartbeatAt = new Date(
			Date.now() - HEARTBEAT_STALE_AFTER_MS - 1_000
		).toISOString()
		const health = await createService({
			get: jest.fn().mockResolvedValue(lastHeartbeatAt),
		}).check()

		expect(health.status).toBe('ok')
		expect(health.checks.worker.status).toBe('stale')
	})
})
