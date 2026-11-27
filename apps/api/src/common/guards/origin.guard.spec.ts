import type { ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { OriginGuard } from './origin.guard'

function contextFor(method: string, origin?: string) {
	const req = { method, headers: origin ? { origin } : {} }
	return {
		switchToHttp: () => ({ getRequest: () => req }),
	} as unknown as ExecutionContext
}

describe('OriginGuard', () => {
	const guard = new OriginGuard(
		new ConfigService({
			WEB_ORIGIN: 'https://invoice.example.com',
		}) as never
	)

	it('allows mutating requests from the web origin', () => {
		expect(
			guard.canActivate(contextFor('POST', 'https://invoice.example.com'))
		).toBe(true)
	})

	it('rejects mutating requests from another origin', () => {
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
			expect(() =>
				guard.canActivate(contextFor(method, 'https://evil.example'))
			).toThrow('Requests from this origin are not allowed')
		}
	})

	it('allows safe methods from any origin', () => {
		expect(
			guard.canActivate(contextFor('GET', 'https://evil.example'))
		).toBe(true)
	})

	it('allows requests without an Origin header (non-browser clients)', () => {
		expect(guard.canActivate(contextFor('POST'))).toBe(true)
	})
})
