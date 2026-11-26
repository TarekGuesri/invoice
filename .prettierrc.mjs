/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */

export default {
	trailingComma: 'es5',
	tabWidth: 4,
	semi: false,
	useTabs: true,
	singleQuote: true,
	jsxSingleQuote: true,
	endOfLine: 'lf',
	printWidth: 80,

	plugins: ['@trivago/prettier-plugin-sort-imports'],

	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrder: [
		'^@/db(/.*)?$',
		'^@/routes/(.*)?$',
		'^@/components/(.*)?$',
		'^@/lib/(.*)?$',
		'^@/validation/(.*)?$',
		'^@/icons/(.*)?$',
		'^@/assets/(.*)?$',
		'^@/(.*)?$',
		'^[./]',
	],

	overrides: [
		{
			files: ['apps/api/**/*.ts'],
			options: {
				importOrderParserPlugins: [
					'typescript',
					'classProperties',
					'decorators-legacy',
				],
			},
		},
	],
}
