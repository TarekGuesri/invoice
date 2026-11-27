import { DynamicModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({})
export class AppConfigModule {
	/** The API and the worker each validate only the variables they use. */
	static forRoot(
		validate: (config: Record<string, unknown>) => Record<string, unknown>
	): DynamicModule {
		return {
			module: AppConfigModule,
			imports: [
				ConfigModule.forRoot({ isGlobal: true, cache: true, validate }),
			],
		}
	}
}
