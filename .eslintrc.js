module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended'
  ],
  env: {
    node: true,
    jest: true,
    es6: true
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'no-undef': 'off'
  },
  ignorePatterns: [
    'out',
    'dist',
    '**/*.d.ts',
    'node_modules',
    '.vscode-test'
  ]
}; 