import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', '.claude'] },

  // App source — strict typed rules + React rules
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Test files — turn off react-refresh rule (test utils are not HMR modules)
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Vite + Vitest config files — typed rules via tsconfig.node.json
  {
    extends: [...tseslint.configs.recommendedTypeChecked],
    files: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Scripts — typed rules via tsconfig.scripts.json
  {
    extends: [...tseslint.configs.recommendedTypeChecked],
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.scripts.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  eslintConfigPrettier,
)
