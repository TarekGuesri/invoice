import { defineConfig } from 'eslint/config'
import globals from 'globals'

import base from './base.mjs'

export default defineConfig([
	...base,
	{
		languageOptions: {
			globals: { ...globals.node, ...globals.jest },
		},
		rules: {
			// Nest injects classes by their runtime reference, so a type-only
			// import of a provider would break dependency injection.
			'@typescript-eslint/consistent-type-imports': 'off',
			'@typescript-eslint/no-extraneous-class': [
				'error',
				{ allowWithDecorator: true },
			],
		},
	},
])
