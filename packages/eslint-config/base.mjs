import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import ts from 'typescript-eslint'

export default defineConfig([
	js.configs.recommended,
	ts.configs.recommendedTypeChecked,
	ts.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: process.cwd(),
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-deprecated': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
			],
		},
	},
	{
		files: ['**/*.{js,cjs,mjs}'],
		extends: [ts.configs.disableTypeChecked],
	},
	{
		ignores: [
			'**/node_modules',
			'**/dist',
			'**/dist-worker',
			'**/build',
			'**/.next',
			'**/coverage',
			'**/src/generated',
			'**/next-env.d.ts',
			'eslint.config.mjs',
		],
	},
	prettier,
])
