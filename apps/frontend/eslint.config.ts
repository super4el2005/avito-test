import { defineConfig } from 'eslint/config';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import js from '@eslint/js';

export default defineConfig([
  {
    ignores: ['.react-router/**', 'build/**', 'coverage/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
      'simple-import-sort': pluginSimpleImportSort,
    },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@mantine'],
            ['^@react-router'],
            ['^@tanstack'],
            ['^diff$'],
            ['^react$'],
            ['^react-dom$'],
            ['^react-icons'],
            ['^react-router$'],
            ['^[a-z]'],
            ['^@ads/shared$', '^@ads/'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$', '^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    files: ['app/routes/ads.$id.edit.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
  },
]);
