import type { Role } from '@repo/db'
import type { Request } from 'express'

/** What the access token proves about the caller. */
export interface AuthUser {
	id: string
	role: Role
}

export interface AccessTokenPayload {
	sub: string
	role: Role
}

export interface AuthenticatedRequest extends Request {
	user: AuthUser
}
