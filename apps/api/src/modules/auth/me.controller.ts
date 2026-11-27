import { Controller, Get, HttpStatus } from '@nestjs/common'
import type { MeResponse } from '@repo/shared'

import { ApiException } from '../../common/errors/api-exception'
import { AuthService, toUserDto } from './auth.service'
import type { AuthUser } from './auth.types'
import { CurrentUser } from './current-user.decorator'

@Controller('me')
export class MeController {
	constructor(private readonly authService: AuthService) {}

	@Get()
	async me(@CurrentUser() caller: AuthUser): Promise<MeResponse> {
		// The access token can outlive a deleted account by a few minutes.
		const user = await this.authService.findUser(caller.id)
		if (!user) {
			throw new ApiException(
				HttpStatus.UNAUTHORIZED,
				'UNAUTHORIZED',
				'You need to log in'
			)
		}
		return { user: toUserDto(user) }
	}
}
