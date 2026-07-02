// @ts-check

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '*.config.js',
      'eslint.config.mjs',
      'app/api/debug*.js',
      'app/api/test*.js',
      'app/api/test.ts',
      'app/api/scratch/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    plugins: {
      sonarjs,
      unicorn,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Javascript / Common rules
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    plugins: {
      import: importPlugin,
      sonarjs,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          case: 'camelCase',
        },
      ],

      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': 'error',

      'no-console': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'sonarjs/no-duplicate-string': 'warn',
    },
  },

  {
    files: ['**/prisma/seed.ts'],
    rules: {
      'no-console': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
);
