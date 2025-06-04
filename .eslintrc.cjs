module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        pathGroups: [
          {
            pattern: '@a_ng_d/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@tps/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@modules/**',
            group: 'internal',
            position: 'after',
          },
        ],
        'newlines-between': 'never',
        alphabetize: {
          order: 'desc',
          caseInsensitive: true,
        },
      },
    ],
  },
}
