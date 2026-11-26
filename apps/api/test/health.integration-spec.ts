import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { HealthResponseSchema } from '@repo/shared'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'

/** Runs against the real Postgres and Redis from docker-compose / CI. */
describe('GET /api/v1/health', () => {
	let app: INestApplication<App>

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		configureApp(app, app.get(ConfigService))
		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('reports the database and Redis as up', async () => {
		const res = await request(app.getHttpServer())
			.get('/api/v1/health')
			.expect(200)

		const health = HealthResponseSchema.parse(res.body)
		expect(health.status).toBe('ok')
		expect(health.checks.database.status).toBe('up')
		expect(health.checks.redis.status).toBe('up')
		expect(res.headers['cache-control']).toBe('no-store')
	})

	it('echoes a request ID for log correlation', async () => {
		const res = await request(app.getHttpServer())
			.get('/api/v1/health')
			.set('x-request-id', 'test-request-id')

		expect(res.headers['x-request-id']).toBe('test-request-id')
	})
})
