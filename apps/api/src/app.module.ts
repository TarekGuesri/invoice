import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { SentryModule } from '@sentry/nestjs/setup'

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { OriginGuard } from './common/guards/origin.guard'
import { AppLoggerModule } from './common/logger/logger.module'
import { AppConfigModule } from './config/app-config.module'
import { validateApiEnv } from './config/env'
import type { ApiEnv } from './config/env'
import { DEFAULT_THROTTLE } from './modules/auth/auth.constants'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard'
import { HealthModule } from './modules/health/health.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { RedisModule } from './modules/redis/redis.module'

@Module({
	imports: [
		SentryModule.forRoot(),
		AppConfigModule.forRoot(validateApiEnv),
		AppLoggerModule,
		// In memory: Cloud Run runs a single instance (--max-instances=1).
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<ApiEnv, true>) => ({
				throttlers: [{ name: 'default', ...DEFAULT_THROTTLE }],
				skipIf: () =>
					config.get('NODE_ENV', { infer: true }) === 'test',
			}),
		}),
		PrismaModule,
		RedisModule,
		HealthModule,
		AuthModule,
	],
	providers: [
		// Global guards run in this order.
		{ provide: APP_GUARD, useClass: OriginGuard },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_FILTER, useClass: AllExceptionsFilter },
	],
})
export class AppModule {}
