import nextVitals from 'eslint-config-next/core-web-vitals'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

import base from './base.mjs'

export default defineConfig([
	...nextVitals,
	...base,
	{
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			'react/self-closing-comp': 'error',
		},
	},
])
