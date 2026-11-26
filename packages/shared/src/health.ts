import { z } from 'zod'

export const DependencyStatusSchema = z.enum(['up', 'down'])

export const DependencyCheckSchema = z.object({
	status: DependencyStatusSchema,
	latencyMs: z.number().nonnegative().nullable(),
})

export const WorkerStatusSchema = z.enum(['up', 'stale', 'unknown'])

export const WorkerCheckSchema = z.object({
	status: WorkerStatusSchema,
	lastHeartbeatAt: z.iso.datetime().nullable(),
})

export const HealthResponseSchema = z.object({
	status: z.enum(['ok', 'error']),
	version: z.string(),
	uptimeSeconds: z.number().nonnegative(),
	checks: z.object({
		database: DependencyCheckSchema,
		redis: DependencyCheckSchema,
		worker: WorkerCheckSchema,
	}),
})

export type DependencyStatus = z.infer<typeof DependencyStatusSchema>
export type DependencyCheck = z.infer<typeof DependencyCheckSchema>
export type WorkerStatus = z.infer<typeof WorkerStatusSchema>
export type WorkerCheck = z.infer<typeof WorkerCheckSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
