import { z } from 'zod'

const publicEnvSchema = z.object({
	NEXT_PUBLIC_API_URL: z.url(),
})

// Next.js only inlines NEXT_PUBLIC_* variables that are referenced literally,
// so each one is listed here instead of passing `process.env` as a whole.
export const env = publicEnvSchema.parse({
	NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
})
