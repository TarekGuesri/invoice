import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import type { Response } from 'express'

import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Get()
	async check(@Res({ passthrough: true }) res: Response) {
		const health = await this.healthService.check()
		res.setHeader('Cache-Control', 'no-store')
		if (health.status !== 'ok') res.status(HttpStatus.SERVICE_UNAVAILABLE)
		return health
	}
}
