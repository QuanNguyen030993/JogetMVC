module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  env: { browser: true, es2022: true, node: true },
  ignorePatterns: ['dist', 'dist-grid', 'node_modules'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
  }
};
