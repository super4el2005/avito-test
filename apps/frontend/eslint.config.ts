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

const isDomainOrSharedFile = (filename: string) => {
  const normalized = filename.split(path.sep).join('/');
  return /\/app\/(domain|shared)\//.test(normalized);
};

const isLowerKebabOrOneWord = (fileBaseName: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:test|spec))?$/.test(fileBaseName);

const toPascalCase = (fileBaseName: string) =>
  fileBaseName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const componentNamingPlugin = {
  rules: {
    'component-file-and-name': {
      meta: {
        type: 'problem' as const,
        fixable: 'code' as const,
        schema: [],
      },
      create(context: unknown) {
        const ruleContext = context as {
          filename?: string;
          getFilename: () => string;
          report: (descriptor: {
            node: unknown;
            message: string;
            fix?: (fixer: unknown) => unknown;
          }) => void;
        };
        const filename = ruleContext.filename ?? ruleContext.getFilename();

        if (!filename || filename === '<input>' || !isComponentFile(filename)) {
          return {};
        }

        const parsed = path.parse(filename);
        const fileBaseName = parsed.name;
        const isKebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fileBaseName);

        if (!isKebabCase) {
          return {
            Program(node: unknown) {
              ruleContext.report({
                node,
                message:
                  'Файлы компонентов в app/components должны быть в kebab-case и в нижнем регистре (пример: image-placeholder.tsx).',
              });
            },
          };
        }

        const expectedComponentName = toPascalCase(fileBaseName);

        const reportInvalidName = (node: unknown, currentName: string, idNode: unknown) => {
          ruleContext.report({
            node,
            message: `Имя компонента должно совпадать с именем файла: "${expectedComponentName}" (сейчас: "${currentName}").`,
            fix: (fixer) => (fixer as { replaceText: (node: unknown, text: string) => unknown }).replaceText(idNode, expectedComponentName),
          });
        };

        return {
          ExportNamedDeclaration(node: unknown) {
            const declarationNode = (node as { declaration?: unknown }).declaration;
            if (!declarationNode) return;

            const declaration = declarationNode as {
              type?: string;
              id?: { name?: string };
              declarations?: Array<{ id?: { type?: string; name?: string }; init?: { type?: string } }>;
            };

            if (declaration.type === 'FunctionDeclaration' && declaration.id?.name) {
              const currentName = declaration.id.name;
              if (currentName !== expectedComponentName) {
                reportInvalidName(node, currentName, declaration.id);
              }
            }

            if (declaration.type === 'VariableDeclaration') {
              for (const variableDeclaration of declaration.declarations ?? []) {
                if (variableDeclaration.id?.type !== 'Identifier') continue;

                const isComponentLikeValue =
                  variableDeclaration.init?.type === 'ArrowFunctionExpression' ||
                  variableDeclaration.init?.type === 'FunctionExpression' ||
                  variableDeclaration.init?.type === 'CallExpression';

                if (!isComponentLikeValue) continue;

                const currentName = variableDeclaration.id.name;
                if (!currentName) continue;
                if (currentName !== expectedComponentName) {
                  reportInvalidName(node, currentName, variableDeclaration.id);
                }
              }
            }
          },
        };
      },
    },
    'domain-shared-file-name': {
      meta: {
        type: 'problem' as const,
        schema: [],
      },
      create(context: unknown) {
        const ruleContext = context as {
          filename?: string;
          getFilename: () => string;
          report: (descriptor: { node: unknown; message: string }) => void;
        };
        const filename = ruleContext.filename ?? ruleContext.getFilename();

        if (!filename || filename === '<input>' || !isDomainOrSharedFile(filename)) {
          return {};
        }

        const parsed = path.parse(filename);
        const fileBaseName = parsed.name;

        if (isLowerKebabOrOneWord(fileBaseName)) {
          return {};
        }

        return {
          Program(node: unknown) {
            ruleContext.report({
              node,
              message:
                'Файлы в app/domain и app/shared должны быть в lower kebab-case (пример: use-ad-edit-ai.ts) или одним словом в нижнем регистре (пример: index.ts).',
            });
          },
        };
      },
    },
  },
};

export default defineConfig([
  {
    ignores: ['.react-router/**', 'build/**', 'coverage/**', 'eslint.config.ts'],
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
      'naming/domain-shared-file-name': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    files: ['app/routes/ads.$id.edit.tsx'],
    rules: {
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
    files: ['app/shared/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '~/domain',
              message: 'Файлы из app/shared не должны импортировать из app/domain.',
            },
          ],
          patterns: [
            {
              group: ['~/domain/*', '../domain', '../domain/*', '../../domain', '../../domain/*'],
              message: 'Файлы из app/shared не должны импортировать из app/domain.',
            },
          ],
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
