import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/prisma/client'

export * from './generated/prisma/client'

/**
 * Prisma 7 talks to Postgres through a driver adapter (node-postgres here),
 * so there is no query-engine binary to ship in the Docker image.
 */
export function createPrismaClientOptions(connectionString: string) {
	return { adapter: new PrismaPg({ connectionString }) }
}

export function createPrismaClient(connectionString: string) {
	return new PrismaClient(createPrismaClientOptions(connectionString))
}
