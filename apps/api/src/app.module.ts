import { Module } from '@nestjs/common'
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core'
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup'

import { AppLoggerModule } from './common/logger/logger.module'
import { AppConfigModule } from './config/app-config.module'
import { HealthModule } from './modules/health/health.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { RedisModule } from './modules/redis/redis.module'

@Module({
	imports: [
		SentryModule.forRoot(),
		AppConfigModule,
		AppLoggerModule,
		PrismaModule,
		RedisModule,
		HealthModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			// Sentry's filter ships without decorator metadata, so its HTTP
			// adapter is passed in explicitly.
			inject: [HttpAdapterHost],
			useFactory: ({ httpAdapter }: HttpAdapterHost) =>
				new SentryGlobalFilter(httpAdapter),
		},
	],
})
export class AppModule {}
