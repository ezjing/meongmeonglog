const fs = require('fs');
const path = require('path');

const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

/**
 * 멍멍로그 FSD 구조 규칙 (자세한 설명은 docs/architecture.md)
 * 레이어: app(Expo Router 라우트) → pages → features → entities → shared
 * - 위 레이어만 아래 레이어를 import한다
 * - 같은 레이어의 다른 slice는 import하지 않는다 (entities끼리는 @x 공개 API만 허용)
 * - 다른 slice는 public API(index.ts)로만 import하고, slice 내부는 상대 경로를 쓴다
 */
const LAYERS = ['app', 'pages', 'features', 'entities', 'shared'];
const SLICED_LAYERS = ['pages', 'features', 'entities'];

const listDirs = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isDirectory())
    : [];

const slicesOf = (layer) => listDirs(path.join(__dirname, 'src', layer));

const layerZones = LAYERS.flatMap((layer, index) =>
  LAYERS.slice(0, index).map((upper) => ({
    target: `./src/${layer}`,
    from: `./src/${upper}`,
    message: `FSD: ${layer} 레이어는 위 레이어(${upper})를 import할 수 없습니다.`,
  })),
);

const crossSliceZones = SLICED_LAYERS.flatMap((layer) =>
  slicesOf(layer).map((slice) => {
    // entities는 다른 entity가 이 slice 전용으로 열어둔 @x 파일만 허용
    const crossImports =
      layer === 'entities'
        ? slicesOf(layer)
            .filter((other) =>
              fs.existsSync(path.join(__dirname, 'src', layer, other, '@x', `${slice}.ts`)),
            )
            .map((other) => `./${other}/@x/${slice}.ts`)
        : [];
    return {
      target: `./src/${layer}/${slice}`,
      from: `./src/${layer}`,
      except: [`./${slice}`, ...crossImports],
      message:
        layer === 'entities'
          ? 'FSD: 다른 entity는 import할 수 없습니다. 꼭 필요하면 대상 entity에 @x/<이 slice>.ts 공개 API를 만드세요.'
          : `FSD: 같은 ${layer} 레이어의 다른 slice는 import할 수 없습니다. 조합은 상위 레이어에서 하세요.`,
    };
  }),
);

const uiDirs = [
  './src/app',
  './src/pages',
  './src/shared/ui',
  ...SLICED_LAYERS.flatMap((layer) =>
    slicesOf(layer)
      .filter((slice) => fs.existsSync(path.join(__dirname, 'src', layer, slice, 'ui')))
      .map((slice) => `./src/${layer}/${slice}/ui`),
  ),
];

const supabaseZones = uiDirs.map((target) => ({
  target,
  from: './src/shared/api/supabase.ts',
  message: '화면·UI에서 supabase client 직접 import 금지. api 세그먼트의 함수나 hook을 사용하세요.',
}));

// 디자인 토큰은 @/shared/config/theme 으로만 쓴다 (1단계 팔레트 직접 사용 금지, docs/design-tokens.md)
const tokenPattern = {
  regex: '^@/shared/config/tokens',
  message:
    '디자인 토큰은 @/shared/config/theme 에서 import하세요. 팔레트(1단계)는 화면에서 쓰지 않습니다.',
};

const publicApiPattern = {
  regex: '^@/(pages|features|entities)/[^/]+/(?!@x/).+',
  message: 'FSD: 다른 slice는 public API(@/<layer>/<slice>)로만 import하세요.',
};

const selfImportBlocks = SLICED_LAYERS.flatMap((layer) =>
  slicesOf(layer).map((slice) => ({
    files: [`src/${layer}/${slice}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            publicApiPattern,
            tokenPattern,
            ...(layer === 'entities'
              ? []
              : [
                  {
                    regex: '^@/entities/[^/]+/@x/',
                    message: 'FSD: @x는 entities끼리만 사용합니다.',
                  },
                ]),
            {
              regex: `^@/${layer}/${slice}$`,
              message: 'FSD: 같은 slice 안에서는 상대 경로로 import하세요 (순환 import 방지).',
            },
          ],
        },
      ],
    },
  })),
);

module.exports = defineConfig([
  globalIgnores([
    '.expo/**',
    'dist/**',
    'web-build/**',
    'node_modules/**',
    'ios/**',
    'android/**',
    'example/**',
    'supabase/functions/**',
  ]),
  expoConfig,
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: { __dirname: 'readonly' } },
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        { zones: [...layerZones, ...crossSliceZones, ...supabaseZones] },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            publicApiPattern,
            tokenPattern,
            { regex: '^@/entities/[^/]+/@x/', message: 'FSD: @x는 entities끼리만 사용합니다.' },
          ],
        },
      ],
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
  ...selfImportBlocks,
  prettier,
]);
