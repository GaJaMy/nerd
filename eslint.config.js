import js from '@eslint/js'
import tanstackQuery from '@tanstack/eslint-plugin-query'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'coverage',
      'dist',
      'eslint.config.js',
      'node_modules',
      'playwright*.config.mjs',
      'playwright-report',
      'scripts/**/*.mjs',
      'src/app/routeTree.gen.ts',
      'test-results',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat['recommended-latest'],
  ...tanstackQuery.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { pattern: 'src/app/**', type: 'app' },
        { pattern: 'src/pages/**', type: 'pages' },
        { pattern: 'src/widgets/**', type: 'widgets' },
        { pattern: 'src/features/**', type: 'features' },
        { pattern: 'src/entities/**', type: 'entities' },
        { pattern: 'src/shared/**', type: 'shared' },
      ],
      'boundaries/include': ['src/**/*'],
      'boundaries/root-path': import.meta.dirname,
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'pages' } },
              disallow: { to: { element: { type: 'app' } } },
            },
            {
              from: { element: { type: 'widgets' } },
              disallow: { to: { element: { types: { anyOf: ['app', 'pages'] } } } },
            },
            {
              from: { element: { type: 'features' } },
              disallow: {
                to: { element: { types: { anyOf: ['app', 'pages', 'widgets'] } } },
              },
            },
            {
              from: { element: { type: 'entities' } },
              disallow: {
                to: {
                  element: { types: { anyOf: ['app', 'pages', 'widgets', 'features'] } },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              disallow: {
                to: {
                  element: {
                    types: { anyOf: ['app', 'pages', 'widgets', 'features', 'entities'] },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
