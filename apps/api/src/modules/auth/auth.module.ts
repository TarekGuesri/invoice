import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

import type { ApiEnv } from '../../config/env'
import { AuthCookies } from './auth-cookies'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { MeController } from './me.controller'

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<ApiEnv, true>) => ({
				secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
				signOptions: {
					algorithm: 'HS256',
					expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }),
				},
				verifyOptions: { algorithms: ['HS256'] },
			}),
		}),
	],
	controllers: [AuthController, MeController],
	providers: [AuthService, AuthCookies],
	// JwtAuthGuard is registered globally in AppModule, which needs JwtService.
	exports: [JwtModule],
})
export class AuthModule {}
