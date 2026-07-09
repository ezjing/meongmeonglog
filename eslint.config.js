const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

/**
 * 멍멍로그 import 방향 규칙
 * app/components → lib/supabase 직접 접근 금지
 */
const importZones = [
  {
    target: './src/app',
    from: './src/lib/supabase',
    message: 'app에서 supabase client 직접 import 금지. hooks/ 또는 lib/api/ 사용',
  },
  {
    target: './src/components',
    from: './src/lib/supabase',
    message: 'components에서 supabase client 직접 import 금지. hooks/ 또는 lib/api/ 사용',
  },
];

module.exports = defineConfig([
  globalIgnores([
    '.expo/**',
    'dist/**',
    'web-build/**',
    'node_modules/**',
    'ios/**',
    'android/**',
    'supabase/functions/**',
  ]),
  expoConfig,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: importZones }],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
]);
