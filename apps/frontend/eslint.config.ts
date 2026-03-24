import { defineConfig } from 'eslint/config';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

import js from '@eslint/js';

const isComponentFile = (filename: string) => {
  const normalized = filename.split(path.sep).join('/');
  return /\/app\/components\/.+\.(tsx|jsx)$/.test(normalized);
};

const toPascalCase = (fileBaseName: string) =>
  fileBaseName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const componentNamingPlugin: any = {
  rules: {
    'component-file-and-name': {
      meta: {
        type: 'problem' as const,
        fixable: 'code' as const,
        schema: [],
      },
      create(context: any) {
        const filename = context.filename ?? context.getFilename();

        if (!filename || filename === '<input>' || !isComponentFile(filename)) {
          return {};
        }

        const parsed = path.parse(filename);
        const fileBaseName = parsed.name;
        const isKebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fileBaseName);

        if (!isKebabCase) {
          return {
            Program(node: any) {
              context.report({
                node,
                message:
                  'Файлы компонентов в app/components должны быть в kebab-case и в нижнем регистре (пример: image-placeholder.tsx).',
              });
            },
          };
        }

        const expectedComponentName = toPascalCase(fileBaseName);

        const reportInvalidName = (node: any, currentName: string, idNode: any) => {
          context.report({
            node,
            message: `Имя компонента должно совпадать с именем файла: "${expectedComponentName}" (сейчас: "${currentName}").`,
            fix: (fixer: any) => fixer.replaceText(idNode, expectedComponentName),
          });
        };

        return {
          ExportNamedDeclaration(node: any) {
            if (!node.declaration) return;

            if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id?.name) {
              const currentName = node.declaration.id.name;
              if (currentName !== expectedComponentName) {
                reportInvalidName(node, currentName, node.declaration.id);
              }
            }

            if (node.declaration.type === 'VariableDeclaration') {
              for (const declaration of node.declaration.declarations) {
                if (declaration.id?.type !== 'Identifier') continue;

                const isComponentLikeValue =
                  declaration.init?.type === 'ArrowFunctionExpression' ||
                  declaration.init?.type === 'FunctionExpression' ||
                  declaration.init?.type === 'CallExpression';

                if (!isComponentLikeValue) continue;

                const currentName = declaration.id.name;
                if (currentName !== expectedComponentName) {
                  reportInvalidName(node, currentName, declaration.id);
                }
              }
            }
          },
        };
      },
    },
  },
};

export default defineConfig([
  {
    ignores: ['.react-router/**', 'build/**', 'coverage/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
      naming: componentNamingPlugin,
      'simple-import-sort': pluginSimpleImportSort,
    },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
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
      'naming/component-file-and-name': 'error',
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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['app/routes/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration > FunctionDeclaration[id!=null]',
          message: 'Route page default export must be anonymous: export default function () {}',
        },
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
