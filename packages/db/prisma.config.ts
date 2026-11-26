import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		// `prisma generate` doesn't connect, so it must work without a URL
		// (e.g. in the Docker build). Migrate commands fail clearly if unset.
		url: process.env.DATABASE_URL ?? '',
	},
})
